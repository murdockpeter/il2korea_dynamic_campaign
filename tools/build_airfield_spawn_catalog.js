const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const frontLineAirfieldsPath = path.join(workspaceRoot, 'catalog', 'front_line_airfields.json');
const landscapeObjectsPath = path.join(workspaceRoot, 'catalog', 'il2_korea_landscape_objects.json');
const outputPath = path.join(workspaceRoot, 'catalog', 'derived_airfield_starts.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeHeadingDegrees(value) {
  const normalized = ((value % 360) + 360) % 360;
  return Math.round(normalized * 1000) / 1000;
}

function distance2d(a, b) {
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.z) - Number(b.z));
}

function dedupeObjects(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = [
      Math.round(Number(entry.x) * 10) / 10,
      Math.round(Number(entry.z) * 10) / 10,
      String(entry.script_path || ''),
      String(entry.model_path || ''),
    ].join('|');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function inferAxis(points) {
  if (points.length < 2) {
    return null;
  }

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanZ = points.reduce((sum, point) => sum + point.z, 0) / points.length;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    const dz = point.z - meanZ;
    sxx += dx * dx;
    szz += dz * dz;
    sxz += dx * dz;
  }

  const angle = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const ux = Math.cos(angle);
  const uz = Math.sin(angle);
  return {
    center: { x: meanX, z: meanZ },
    axis: { x: ux, z: uz },
    heading: normalizeHeadingDegrees((Math.atan2(ux, uz) * 180) / Math.PI),
  };
}

function projectPoint(point, origin, axis) {
  return (point.x - origin.x) * axis.x + (point.z - origin.z) * axis.z;
}

function projectToAxis(point, origin, axis) {
  const t = projectPoint(point, origin, axis);
  return {
    x: origin.x + axis.x * t,
    z: origin.z + axis.z * t,
    t,
  };
}

function inferAirfieldGeometry(airfield, objects) {
  const groupObjects = dedupeObjects(
    objects.filter((entry) => String(entry.group_path || '').startsWith(airfield.groupPath || ''))
  );

  const lightObjects = groupObjects.filter((entry) =>
    `${entry.script_path || ''} ${entry.model_path || ''}`.toLowerCase().includes('rw_lighttower')
  );
  const supportObjects = groupObjects.filter((entry) => {
    const blob = `${entry.script_path || ''} ${entry.model_path || ''}`.toLowerCase();
    return blob.includes('arf_hangar') || blob.includes('arf_tower');
  });

  const axisSource = lightObjects.length >= 4 ? lightObjects : supportObjects.length >= 4 ? supportObjects : groupObjects;
  const axis = inferAxis(axisSource.map((entry) => ({ x: Number(entry.x), z: Number(entry.z) })));
  if (!axis) {
    return null;
  }

  const supportCenter =
    supportObjects.length > 0
      ? {
          x: supportObjects.reduce((sum, entry) => sum + Number(entry.x), 0) / supportObjects.length,
          z: supportObjects.reduce((sum, entry) => sum + Number(entry.z), 0) / supportObjects.length,
        }
      : { x: airfield.position.x, z: airfield.position.z };

  const projectedSupport = projectToAxis(supportCenter, axis.center, axis.axis);
  const projections = axisSource
    .map((entry) => projectPoint({ x: Number(entry.x), z: Number(entry.z) }, axis.center, axis.axis))
    .sort((left, right) => left - right);

  const minT = projections[0];
  const maxT = projections[projections.length - 1];
  const runwayLength = Math.max(400, maxT - minT);
  const thresholdNearSupport = Math.abs(projectedSupport.t - minT) <= Math.abs(projectedSupport.t - maxT) ? minT : maxT;
  const takeoffDirection = thresholdNearSupport === minT ? 1 : -1;
  const spawnT = thresholdNearSupport + takeoffDirection * Math.min(180, runwayLength * 0.12);
  const taxiT = spawnT + takeoffDirection * Math.min(420, runwayLength * 0.2);

  const spawnPoint = {
    x: axis.center.x + axis.axis.x * spawnT,
    z: axis.center.z + axis.axis.z * spawnT,
  };
  const taxiPoint = {
    x: axis.center.x + axis.axis.x * taxiT,
    z: axis.center.z + axis.axis.z * taxiT,
  };

  const confidence =
    lightObjects.length >= 6
      ? 'high'
      : lightObjects.length >= 3 || supportObjects.length >= 6
        ? 'medium'
        : 'low';

  return {
    derivedRunwayAxisDeg: normalizeHeadingDegrees(axis.heading),
    derivedHeadingDeg: normalizeHeadingDegrees(axis.heading + (takeoffDirection < 0 ? 180 : 0)),
    reciprocalHeadingDeg: normalizeHeadingDegrees(axis.heading + (takeoffDirection < 0 ? 0 : 180)),
    estimatedRunwayLengthM: Math.round(runwayLength),
    derivedSpawnPoint: {
      x: Math.round(spawnPoint.x * 1000) / 1000,
      z: Math.round(spawnPoint.z * 1000) / 1000,
    },
    derivedTaxiPoint: {
      x: Math.round(taxiPoint.x * 1000) / 1000,
      z: Math.round(taxiPoint.z * 1000) / 1000,
    },
    supportApronCenter: {
      x: Math.round(supportCenter.x * 1000) / 1000,
      z: Math.round(supportCenter.z * 1000) / 1000,
    },
    supportDistanceM: Math.round(distance2d(projectedSupport, supportCenter)),
    objectStats: {
      totalObjects: groupObjects.length,
      runwayLightObjects: lightObjects.length,
      supportObjects: supportObjects.length,
    },
    confidence,
  };
}

function buildCatalog() {
  const airfieldsData = readJson(frontLineAirfieldsPath);
  const landscapeObjects = readJson(landscapeObjectsPath);
  const existing = fs.existsSync(outputPath) ? readJson(outputPath) : { airfields: [] };
  const existingById = new Map((existing.airfields || []).map((entry) => [entry.id, entry]));

  const airfields = (airfieldsData.startingAirfields || [])
    .filter((entry) => entry.id !== 'auto' && entry.groupPath && entry.position)
    .map((airfield) => {
      const previous = existingById.get(airfield.id) || {};
      const derived = inferAirfieldGeometry(airfield, landscapeObjects) || {};
      return {
        id: airfield.id,
        label: airfield.label,
        coalition: airfield.coalition,
        groupPath: airfield.groupPath,
        referencePosition: airfield.position,
        status: previous.status || 'derived-unverified',
        notes: Array.isArray(previous.notes) ? previous.notes : [],
        screenshotRefs: Array.isArray(previous.screenshotRefs) ? previous.screenshotRefs : [],
        manualOverride: previous.manualOverride || null,
        ...derived,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    sourceFiles: {
      frontLineAirfields: path.relative(workspaceRoot, frontLineAirfieldsPath).replace(/\\/g, '/'),
      landscapeObjects: path.relative(workspaceRoot, landscapeObjectsPath).replace(/\\/g, '/'),
    },
    airfields,
  };
}

const output = buildCatalog();
writeJson(outputPath, output);
console.log(`Wrote ${output.airfields.length} airfield entries to ${outputPath}`);
