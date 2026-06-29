const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(workspaceRoot, 'catalog', 'il2_korea_catalog.json');
const generatedRoot = path.join(workspaceRoot, 'generated');
const il2MissionExportRoot = path.join(
  'C:\\Program Files\\IL2Series\\game\\data\\Missions',
  'CodexGenerated'
);
const il2MissionTemplateRoot = path.join('C:\\Program Files\\IL2Series\\game\\data\\Missions');
const il2MultiplayerRoot = path.join('C:\\Program Files\\IL2Series\\game\\data\\Multiplayer');
const il2CoopExportRoot = path.join(il2MultiplayerRoot, 'COOP');
const il2CooperativeExportRoot = path.join(il2MultiplayerRoot, 'Cooperative');
const il2NsDataUserRoot = path.join('C:\\Program Files\\IL2Series\\game\\data\\NSData', 'UserData');

const aircraftCoalitions = {
  f51d: 'UN/US-aligned',
  f80c10: 'UN/US-aligned',
  f84e: 'UN/US-aligned',
  f86a5: 'UN/US-aligned',
  il10: 'DPRK/PRC/Soviet-aligned',
  la11: 'DPRK/PRC/Soviet-aligned',
  mig15bis: 'DPRK/PRC/Soviet-aligned',
  yak9p: 'DPRK/PRC/Soviet-aligned',
};

const coalitionOpposites = {
  'UN/US-aligned': 'DPRK/PRC/Soviet-aligned',
  'DPRK/PRC/Soviet-aligned': 'UN/US-aligned',
};

const coalitionCountries = {
  'UN/US-aligned': 601,
  'DPRK/PRC/Soviet-aligned': 501,
  'terrain/static': 0,
  unknown: 0,
};

const missionAreaTemplates = {
  'Harbor Strike': {
    anchor: { x: 237120, y: 8, z: 123640 },
    heading: 310,
    playerOffset: { x: -13000, z: -4500, altitude: 1400 },
    iconDescription: 'Strike the harbor targets marked on the map.',
  },
  'Airfield Strike': {
    anchor: { x: 267260, y: 38, z: 184430 },
    heading: 212,
    playerOffset: { x: -12000, z: 2500, altitude: 1500 },
    iconDescription: 'Attack the marked airfield target area.',
  },
  'Bridge Strike': {
    anchor: { x: 97314, y: 18, z: 276170 },
    heading: 2,
    playerOffset: { x: -9000, z: -1500, altitude: 1200 },
    iconDescription: 'Destroy the bridge target marked on the map.',
  },
  'Rail Interdiction': {
    anchor: { x: 98450, y: 18, z: 276250 },
    heading: 4,
    playerOffset: { x: -10000, z: -3000, altitude: 1200 },
    iconDescription: 'Interdict the rail target area marked on the map.',
  },
  'Industrial Strike': {
    anchor: { x: 199050, y: 34, z: 165520 },
    heading: 280,
    playerOffset: { x: -11000, z: 3500, altitude: 1500 },
    iconDescription: 'Bomb the industrial target area marked on the map.',
  },
  'Troop Area Strike': {
    anchor: { x: 267220, y: 38, z: 184520 },
    heading: 210,
    playerOffset: { x: -10500, z: 2800, altitude: 1200 },
    iconDescription: 'Attack the troop concentration marked on the map.',
  },
  'Ground Attack': {
    anchor: { x: 267220, y: 38, z: 184520 },
    heading: 210,
    playerOffset: { x: -10500, z: 2800, altitude: 1200 },
    iconDescription: 'Attack the marked ground targets.',
  },
};

const missionTypeProfiles = {
  'Airfield Strike': {
    objectiveText: 'Attack the marked airfield target area.',
    commandText: 'Proceed to the target airfield and begin strike runs.',
    ingressText: 'Expect anti-aircraft fire and defending fighters near the airfield.',
    recoveryText: 'Strike complete. Exit the target area and return to base.',
    iconText: 'Attack the marked airfield target area.',
  },
  'Bridge Strike': {
    objectiveText: 'Destroy the bridge target marked on the map.',
    commandText: 'Proceed to the bridge target and destroy the span.',
    ingressText: 'Enemy opposition is likely near the bridge approaches.',
    recoveryText: 'Bridge strike complete. Withdraw and return to base.',
    iconText: 'Destroy the bridge target marked on the map.',
  },
  'Ground Attack': {
    objectiveText: 'Attack the marked ground targets.',
    commandText: 'Proceed to the target area and attack ground targets of opportunity.',
    ingressText: 'Enemy light flak and dispersed vehicles are expected.',
    recoveryText: 'Ground attack complete. Reform and return to base.',
    iconText: 'Attack the marked ground targets.',
  },
  'Harbor Strike': {
    objectiveText: 'Strike the harbor targets marked on the map.',
    commandText: 'Proceed to the harbor and attack shipping and port facilities.',
    ingressText: 'Expect concentrated anti-aircraft defenses near the waterfront.',
    recoveryText: 'Harbor strike complete. Egress over water and return to base.',
    iconText: 'Strike the harbor targets marked on the map.',
  },
  'Industrial Strike': {
    objectiveText: 'Bomb the industrial target area marked on the map.',
    commandText: 'Proceed to the industrial zone and attack production facilities.',
    ingressText: 'Enemy defenses are expected around warehouses and factory blocks.',
    recoveryText: 'Industrial strike complete. Exit the area and return to base.',
    iconText: 'Bomb the industrial target area marked on the map.',
  },
  'Rail Interdiction': {
    objectiveText: 'Interdict the rail target area marked on the map.',
    commandText: 'Proceed to the rail corridor and attack rolling stock or track assets.',
    ingressText: 'Expect light to moderate flak near the rail line.',
    recoveryText: 'Rail interdiction complete. Leave the area and return to base.',
    iconText: 'Interdict the rail target area marked on the map.',
  },
  'Troop Area Strike': {
    objectiveText: 'Attack the troop concentration marked on the map.',
    commandText: 'Proceed to the troop area and attack the concentration below.',
    ingressText: 'Expect dispersed small arms and light automatic weapons fire.',
    recoveryText: 'Strike complete. Clear the area and return to base.',
    iconText: 'Attack the troop concentration marked on the map.',
  },
};

const weatherPresets = {
  Clear: {
    cloudLevel: 1300,
    cloudHeight: 6000,
    precLevel: 0,
    precType: 0,
    cloudConfig: 'summer\\00_Clear_00\\sky.ini',
    haze: 0,
    layerFog: 0,
  },
  'Broken Cloud': {
    cloudLevel: 1500,
    cloudHeight: 2800,
    precLevel: 2,
    precType: 1,
    cloudConfig: 'summer\\02_Medium_06\\sky.ini',
    haze: 0.08,
    layerFog: 0,
  },
  Overcast: {
    cloudLevel: 1400,
    cloudHeight: 1800,
    precLevel: 5,
    precType: 1,
    cloudConfig: 'summer\\03_Heavy_08\\sky.ini',
    haze: 0.12,
    layerFog: 0,
  },
  'Poor Visibility': {
    cloudLevel: 1100,
    cloudHeight: 1500,
    precLevel: 4,
    precType: 1,
    cloudConfig: 'summer\\02_Medium_09\\sky.ini',
    haze: 0.32,
    layerFog: 1,
  },
};

const missionTemplates = {
  'UN/US-aligned': {
    baseName: '[DEMO]InchonStrike',
    playerAircraft: 'f86a5',
  },
  'DPRK/PRC/Soviet-aligned': {
    baseName: '[DEMO]BlackThursday',
    playerAircraft: 'mig15bis',
  },
};

const supportAircraftPools = {
  'UN/US-aligned': {
    strike: ['f80c10', 'f84e', 'f86a5'],
    fighter: ['f51d', 'f80c10', 'f84e', 'f86a5'],
  },
  'DPRK/PRC/Soviet-aligned': {
    strike: ['la11', 'yak9p', 'mig15bis'],
    fighter: ['la11', 'yak9p', 'mig15bis'],
  },
};

const preferredSupportAircraft = {
  il10: ['la11', 'yak9p'],
  la11: ['la11', 'yak9p'],
  yak9p: ['yak9p', 'la11'],
  mig15bis: ['mig15bis', 'yak9p'],
  f51d: ['f80c10', 'f84e'],
  f80c10: ['f80c10', 'f84e'],
  f84e: ['f84e', 'f86a5'],
  f86a5: ['f86a5', 'f84e'],
};

const startTimePresets = [
  { value: '05:30:0', label: 'Dawn 05:30' },
  { value: '08:00:0', label: 'Morning 08:00' },
  { value: '12:00:0', label: 'Noon 12:00' },
  { value: '15:00:0', label: 'Afternoon 15:00' },
  { value: '18:30:0', label: 'Dusk 18:30' },
];

const startingAirfields = [
  {
    id: 'auto',
    label: 'Auto',
    coalition: 'any',
    position: null,
  },
  {
    id: 'antung',
    label: 'Antung',
    coalition: 'DPRK/PRC/Soviet-aligned',
    position: { x: 380795.0, z: 52595.987 },
  },
  {
    id: 'seoul',
    label: 'Seoul (K-16)',
    coalition: 'UN/US-aligned',
    position: { x: 102349.0, z: 280779.0 },
  },
  {
    id: 'kimpo',
    label: 'Kimpo (K-14)',
    coalition: 'UN/US-aligned',
    position: { x: 105934.0, z: 269477.0 },
  },
  {
    id: 'yangsu_ri',
    label: 'Yangsu-ri (K-49)',
    coalition: 'UN/US-aligned',
    position: { x: 102114.0, z: 315358.0 },
  },
  {
    id: 'suwon',
    label: 'Suwon (K-13)',
    coalition: 'UN/US-aligned',
    position: { x: 70869.0, z: 288613.0 },
  },
];

const ambientTemplateConfig = {
  '[DEMO]InchonStrike': {
    radius: 260,
    staticPlanePool: ['f51d', 'f80c10', 'f84e', 'f86a5', 'c47b'],
    movableBlockPrefixes: [
      'static_plane_',
      'static_equipment_',
      'static_munition_',
      'mil_barrels_',
      'mil_boxes_',
      'port_yard_boxes_',
      'ind_mine_planks',
    ],
    movableVehicleScripts: new Set([
      'ancps4.txt',
      'ancps6b-generator.txt',
      'ancps6b-control.txt',
      'ancps6b.txt',
    ]),
  },
  '[DEMO]BlackThursday': {
    radius: 260,
    staticPlanePool: ['il10', 'la11', 'yak9p', 'mig15bis', 'li2t'],
    movableBlockPrefixes: ['static_plane_', 'mil_camonet', 'mil_boxes_'],
    movableVehicleScripts: new Set([
      'studebakerus6.txt',
      'studebakerus6-refueler.txt',
      'studebakerus6-tanker.txt',
      'gaz55.txt',
      'gaz67b.txt',
      'p20.txt',
    ]),
  },
};

function readCatalog() {
  const raw = fs.readFileSync(catalogPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getAircraftCoalition(aircraft) {
  return aircraftCoalitions[aircraft] || null;
}

function getOpposingCoalition(aircraft) {
  const coalition = getAircraftCoalition(aircraft);
  return coalition ? coalitionOpposites[coalition] : null;
}

function getAircraftCountry(aircraft) {
  return coalitionCountries[getAircraftCoalition(aircraft)] || 601;
}

function getEnemyCountry(aircraft) {
  return coalitionCountries[getOpposingCoalition(aircraft)] || 501;
}

function getFriendlyAlignedCountries(aircraft) {
  const coalition = getAircraftCoalition(aircraft);
  if (coalition === 'UN/US-aligned') {
    return new Set(['601', '602', '603']);
  }

  if (coalition === 'DPRK/PRC/Soviet-aligned') {
    return new Set(['501', '502', '503']);
  }

  return new Set([String(getAircraftCountry(aircraft))]);
}

function categorizeTarget(entry) {
  const source = `${entry.script_path || ''} ${entry.model_path || ''}`.toLowerCase();

  if (entry.category === 'bridge') return 'Bridge Strike';
  if (source.includes('rail') || source.includes('train') || source.includes('rw_')) return 'Rail Interdiction';
  if (source.includes('shipyard') || source.includes('port_') || source.includes('lighthouse')) return 'Harbor Strike';
  if (source.includes('factory') || source.includes('warehouse') || source.includes('storage') || source.includes('power')) return 'Industrial Strike';
  if (source.includes('barrack') || source.includes('tent') || source.includes('dugout') || source.includes('ammo')) return 'Troop Area Strike';
  if (source.includes('airfield') || source.includes('hangar') || source.includes('controltower') || source.includes('caponier')) return 'Airfield Strike';

  return 'Ground Attack';
}

function getObjectKind(entry) {
  switch (entry.category) {
    case 'bridge':
      return 'Bridge';
    case 'ground_vehicle':
    case 'fixed_weapon':
      return 'Vehicle';
    case 'naval':
      return 'Ship';
    default:
      return 'Block';
  }
}

function buildOptions() {
  const catalog = readCatalog();
  const missionCatalog = catalog.mission_object_catalog || [];
  const referenceCatalog = catalog.reference_catalog || [];
  const confirmedFlyableAircraft = new Set([
    'f51d',
    'f80c10',
    'f84e',
    'f86a5',
    'il10',
    'la11',
    'mig15bis',
    'yak9p',
  ]);

  const aircraftEntries = missionCatalog.filter((entry) => entry.category === 'aircraft');
  const referenceAircraft = referenceCatalog.filter((entry) => entry.category === 'aircraft');
  const targetEntries = missionCatalog.filter((entry) =>
    ['static_target', 'bridge', 'fixed_weapon', 'ground_vehicle', 'naval'].includes(entry.category)
  );

  const aircraft = uniqueSorted([
    ...aircraftEntries.map((entry) => path.basename(entry.script_path || '', '.txt')),
    ...referenceAircraft.map((entry) => entry.asset_name),
  ]).filter((aircraftName) => confirmedFlyableAircraft.has(aircraftName));

  return {
    aircraft,
    targetTypes: uniqueSorted(targetEntries.map(categorizeTarget)),
    landscapes: uniqueSorted((catalog.landscape_templates || []).map((entry) => entry.landscape)),
    factions: uniqueSorted(targetEntries.map((entry) => entry.historical_faction_guess)),
    startTimes: startTimePresets,
    startingAirfields,
    aircraftCoalitions,
    coalitionOpposites,
  };
}

function pickOne(items, seed) {
  if (!items.length) return null;
  const index = Math.abs(seed) % items.length;
  return items[index];
}

function makeSeed(input) {
  return `${input.aircraft}|${input.targetType}|${input.landscape}|${input.enemyFaction}|${input.weather}`
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildTargetPool(missionCatalog, input, enemyFaction) {
  return missionCatalog.filter((entry) => {
    if (!['static_target', 'bridge', 'fixed_weapon', 'ground_vehicle', 'naval'].includes(entry.category)) {
      return false;
    }

    if (input.targetType && categorizeTarget(entry) !== input.targetType) {
      return false;
    }

    if (enemyFaction) {
      const targetFaction = entry.historical_faction_guess;
      const isNeutralStrikeTarget = targetFaction === 'terrain/static' || targetFaction === 'unknown';
      if (!isNeutralStrikeTarget && targetFaction !== enemyFaction) {
        return false;
      }
    }

    return true;
  });
}

function chooseTargets(targetPool, seed) {
  const chosenTargets = [];
  const maxTargets = Math.min(3, targetPool.length);
  for (let i = 0; i < maxTargets; i += 1) {
    const target = pickOne(targetPool, seed + i * 17);
    if (target && !chosenTargets.find((entry) => entry.key === target.key)) {
      chosenTargets.push(target);
    }
  }
  return chosenTargets;
}

function getMissionArea(targetType) {
  return missionAreaTemplates[targetType] || missionAreaTemplates['Ground Attack'];
}

function getMissionTypeProfile(targetType) {
  return missionTypeProfiles[targetType] || missionTypeProfiles['Ground Attack'];
}

function getAvailableStartingAirfields(aircraft) {
  const coalition = getAircraftCoalition(aircraft);
  return startingAirfields.filter((entry) => entry.coalition === 'any' || entry.coalition === coalition);
}

function getTemplateStartingAirfield(aircraft) {
  return getAircraftCoalition(aircraft) === 'UN/US-aligned'
    ? startingAirfields.find((entry) => entry.id === 'seoul')
    : startingAirfields.find((entry) => entry.id === 'antung');
}

function getSelectedStartingAirfield(aircraft, requestedAirfieldId) {
  const available = getAvailableStartingAirfields(aircraft);
  const fallback = getTemplateStartingAirfield(aircraft);
  if (!requestedAirfieldId || requestedAirfieldId === 'auto') {
    return fallback;
  }

  return available.find((entry) => entry.id === requestedAirfieldId) || fallback;
}

function chooseSupportAircraft(playerAircraft, role, seed) {
  const coalition = getAircraftCoalition(playerAircraft);
  const poolSet = supportAircraftPools[coalition];
  if (!poolSet) {
    return playerAircraft;
  }

  const poolKey = role === 'fighter' ? 'fighter' : 'strike';
  const pool = poolSet[poolKey] || [playerAircraft];
  const preferredPool = preferredSupportAircraft[playerAircraft]?.filter((entry) => pool.includes(entry)) || [];
  const candidatePool = preferredPool.length ? preferredPool : pool;
  const filteredPool = candidatePool.filter((entry) => entry !== playerAircraft);
  const finalPool = filteredPool.length ? filteredPool : candidatePool;
  return pickOne(finalPool, seed + 73) || playerAircraft;
}

function formatNumber(value) {
  return Number(value).toFixed(3);
}

function normalizeMissionPath(value) {
  return String(value || '').split('\\\\').join('\\');
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function formatMissionTimeLabel(value) {
  const parts = String(value || '09:00:0').split(':');
  const hours = parts[0]?.padStart(2, '0') || '09';
  const minutes = parts[1]?.padStart(2, '0') || '00';
  return `${hours}:${minutes}`;
}

function getTemplateDefinition(aircraft) {
  const coalition = getAircraftCoalition(aircraft);
  return missionTemplates[coalition] || missionTemplates['UN/US-aligned'];
}

function readTemplateMissionText(baseName) {
  return fs.readFileSync(path.join(il2MissionTemplateRoot, `${baseName}.Mission`), 'utf8');
}

function readTemplateLocalizationText(baseName) {
  return fs.readFileSync(path.join(il2MissionTemplateRoot, `${baseName}.eng`), 'utf16le').replace(/^\uFEFF/, '');
}

function replaceMissionOption(text, key, value, quoted = false) {
  const renderedValue = quoted ? `"${value}"` : `${value}`;
  return text.replace(new RegExp(`(^\\s*${key}\\s*=\\s*)([^;]+)(;)`, 'm'), `$1${renderedValue}$3`);
}

function extractMissionValue(block, key) {
  const match = block.match(new RegExp(`${key}\\s*=\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

function parsePlaneBlocks(missionText) {
  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(planeBlockPattern) || [];
  return blocks.map((block) => ({
    block,
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    index: extractMissionValue(block, 'Index') || '',
    linkTrId: extractMissionValue(block, 'LinkTrId') || '',
    country: extractMissionValue(block, 'Country') || '',
    script: extractMissionValue(block, 'Script')?.replace(/^"|"$/g, '') || '',
    startType: extractMissionValue(block, 'StartType') || '',
    callsign: extractMissionValue(block, 'Callsign') || '',
    callnum: extractMissionValue(block, 'Callnum') || '',
    aiLevel: extractMissionValue(block, 'AILevel') || '',
    desc: extractMissionValue(block, 'Desc')?.replace(/^"|"$/g, '') || '',
  }));
}

function parseVehicleBlocks(missionText) {
  const vehicleBlockPattern = /Vehicle\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(vehicleBlockPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    linkTrId: extractMissionValue(block, 'LinkTrId') || '',
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    script: extractMissionValue(block, 'Script')?.replace(/^"|"$/g, '') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
  }));
}

function parseBlockObjects(missionText) {
  const blockPattern = /Block\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(blockPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    script: extractMissionValue(block, 'Script')?.replace(/^"|"$/g, '') || '',
    model: extractMissionValue(block, 'Model')?.replace(/^"|"$/g, '') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
  }));
}

function parseEntityBlocks(missionText) {
  const entityPattern = /MCU_TR_Entity\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(entityPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    misObjId: extractMissionValue(block, 'MisObjID') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
    enabled: extractMissionValue(block, 'Enabled') || '',
  }));
}

function getOpposingAlignedCountries(aircraft) {
  const coalition = getOpposingCoalition(aircraft);
  if (coalition === 'UN/US-aligned') {
    return new Set(['601', '602', '603']);
  }

  if (coalition === 'DPRK/PRC/Soviet-aligned') {
    return new Set(['501', '502', '503']);
  }

  return new Set([String(getEnemyCountry(aircraft))]);
}

function findPlayerFlightSignature(missionText) {
  const blocks = parsePlaneBlocks(missionText).map((entry) => entry.block);
  const playerBlock =
    blocks.find((block) => block.includes('Desc = "PLAYERSQUAD";')) ||
    blocks.find((block) => block.includes('AILevel = 0;') && block.includes('NumberInFormation = 0;'));

  if (!playerBlock) {
    throw new Error('Could not locate PLAYERSQUAD plane block in template mission.');
  }

  return {
    callsign: extractMissionValue(playerBlock, 'Callsign'),
    country: extractMissionValue(playerBlock, 'Country'),
  };
}

function getPlayerFlightEntityIds(missionText) {
  const playerFlight = findPlayerFlightSignature(missionText);
  return parsePlaneBlocks(missionText)
    .filter((entry) => entry.callsign === playerFlight.callsign && entry.country === playerFlight.country)
    .map((entry) => entry.linkTrId)
    .filter(Boolean);
}

function getPlayerFlightPlaneIndices(missionText) {
  const playerFlight = findPlayerFlightSignature(missionText);
  return parsePlaneBlocks(missionText)
    .filter((entry) => entry.callsign === playerFlight.callsign && entry.country === playerFlight.country)
    .map((entry) => entry.index)
    .filter(Boolean);
}

function getTemplatePlayerAnchor(missionText) {
  const playerFlight = findPlayerFlightSignature(missionText);
  const playerLead =
    parsePlaneBlocks(missionText).find(
      (entry) =>
        entry.callsign === playerFlight.callsign &&
        entry.country === playerFlight.country &&
        extractMissionValue(entry.block, 'NumberInFormation') === '0'
    ) ||
    parsePlaneBlocks(missionText).find(
      (entry) => entry.callsign === playerFlight.callsign && entry.country === playerFlight.country
    );

  if (!playerLead) {
    throw new Error('Could not locate player lead plane for ambiance anchoring.');
  }

  return { x: Number(extractMissionValue(playerLead.block, 'XPos')), z: Number(extractMissionValue(playerLead.block, 'ZPos')) };
}

function getAmbientTemplateConfig(playerAircraft) {
  const template = getTemplateDefinition(playerAircraft);
  return ambientTemplateConfig[template.baseName] || null;
}

function collectAmbientPackage(missionText, playerAircraft) {
  const config = getAmbientTemplateConfig(playerAircraft);
  if (!config) {
    return {
      planeObjectIds: new Set(),
      planeEntityIds: new Set(),
      vehicleObjectIds: new Set(),
      vehicleEntityIds: new Set(),
      blockIds: new Set(),
      staticPlaneBlockIds: [],
      optionalEntityIds: [],
    };
  }

  const anchor = getTemplatePlayerAnchor(missionText);
  const distanceToAnchor = (x, z) => Math.hypot(x - anchor.x, z - anchor.z);
  const playerPlaneIds = new Set(getPlayerFlightPlaneIndices(missionText));
  const playerEntityIds = new Set(getPlayerFlightEntityIds(missionText));

  const planeCandidates = parsePlaneBlocks(missionText).filter((entry) => {
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.z)) {
      return false;
    }
    if (playerPlaneIds.has(entry.index) || playerEntityIds.has(entry.linkTrId)) {
      return false;
    }
    if (distanceToAnchor(entry.x, entry.z) > config.radius) {
      return false;
    }
    return entry.callsign === '0' || entry.aiLevel === '1' || entry.startType === '2';
  });

  const vehicleCandidates = parseVehicleBlocks(missionText).filter((entry) => {
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.z)) {
      return false;
    }
    if (distanceToAnchor(entry.x, entry.z) > config.radius) {
      return false;
    }
    return config.movableVehicleScripts.has(path.basename(entry.script || '').toLowerCase());
  });

  const blockCandidates = parseBlockObjects(missionText).filter((entry) => {
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.z)) {
      return false;
    }
    if (distanceToAnchor(entry.x, entry.z) > config.radius) {
      return false;
    }
    const scriptName = path.basename(entry.script || '').toLowerCase();
    return config.movableBlockPrefixes.some((prefix) => scriptName.startsWith(prefix.toLowerCase()));
  });

  return {
    planeObjectIds: new Set(planeCandidates.map((entry) => entry.index)),
    planeEntityIds: new Set(planeCandidates.map((entry) => entry.linkTrId).filter(Boolean)),
    vehicleObjectIds: new Set(vehicleCandidates.map((entry) => entry.index)),
    vehicleEntityIds: new Set(vehicleCandidates.map((entry) => entry.linkTrId).filter(Boolean)),
    blockIds: new Set(blockCandidates.map((entry) => entry.index)),
    staticPlaneBlockIds: blockCandidates
      .filter((entry) => path.basename(entry.script || '').toLowerCase().startsWith('static_plane_'))
      .map((entry) => entry.index),
    optionalEntityIds: [
      ...planeCandidates.map((entry) => entry.linkTrId).filter(Boolean),
      ...vehicleCandidates.map((entry) => entry.linkTrId).filter(Boolean),
    ],
  };
}

function enableCoopPlayerFlight(missionText) {
  const playerFlight = findPlayerFlightSignature(missionText);
  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;

  return missionText.replace(planeBlockPattern, (block) => {
    const callsign = extractMissionValue(block, 'Callsign');
    const country = extractMissionValue(block, 'Country');
    if (callsign !== playerFlight.callsign || country !== playerFlight.country) {
      return block;
    }

    let updated = block
      .replace(/(\n\s*AILevel\s*=\s*)\d+;/, '$10;')
      .replace(/(\n\s*CoopStart\s*=\s*)\d+;/, '$10;');

    if (!updated.includes('Desc = "PLAYERSQUAD";')) {
      updated = updated.replace(/(\n\s*Desc\s*=\s*)"[^"]*";/, '$1"PLAYERSQUAD";');
    }

    return updated;
  });
}

function retargetTemplateAircraft(missionText, templateAircraft, selectedAircraft) {
  const templateScript = `LuaScripts\\WorldObjects\\Planes\\${templateAircraft}.txt`;
  const selectedScript = `LuaScripts\\WorldObjects\\Planes\\${selectedAircraft}.txt`;
  const templateModel = `graphics\\planes\\${templateAircraft}\\${templateAircraft}.mgm`;
  const selectedModel = `graphics\\planes\\${selectedAircraft}\\${selectedAircraft}.mgm`;
  const playerFlight = findPlayerFlightSignature(missionText);
  let updated = missionText;

  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(planeBlockPattern, (block) => {
    if (!block.includes(templateScript)) {
      return block;
    }

    const callsign = extractMissionValue(block, 'Callsign');
    const country = extractMissionValue(block, 'Country');
    const isPlayerFlight = callsign === playerFlight.callsign && country === playerFlight.country;
    if (!isPlayerFlight) {
      return block;
    }

    return block
      .split(templateScript).join(selectedScript)
      .split(templateModel).join(selectedModel)
      .replace(/(\n\s*PayloadId\s*=\s*)\d+;/, '$10;')
      .replace(/(\n\s*ModMask\s*=\s*)\d+;/, '$11;')
      .replace(/(\n\s*Fuel\s*=\s*)[^;]+;/, '$11;')
      .replace(/(\n\s*Skin\s*=\s*)"[^"]*";/, '$1"";')
      .replace(/(\n\s*BotSkin\s*=\s*)"[^"]*";/, '$1"";')
      .replace(/(\n\s*Emblem\s*=\s*)\d+;/, '$10;');
  });

  return updated;
}

function retargetFriendlySupportFlights(missionText, playerAircraft, supportAircraft) {
  const supportScript = `LuaScripts\\WorldObjects\\Planes\\${supportAircraft}.txt`;
  const supportModel = `graphics\\planes\\${supportAircraft}\\${supportAircraft}.mgm`;
  const playerFlight = findPlayerFlightSignature(missionText);
  const alignedCountries = getFriendlyAlignedCountries(playerAircraft);
  let updated = missionText;

  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(planeBlockPattern, (block) => {
    const country = extractMissionValue(block, 'Country');
    const callsign = extractMissionValue(block, 'Callsign');
    const isPlayerFlight = callsign === playerFlight.callsign && country === playerFlight.country;

    if (!alignedCountries.has(country) || isPlayerFlight) {
      return block;
    }

    return block
      .replace(/(\n\s*Script\s*=\s*)"[^"]*";/, `$1"${supportScript}";`)
      .replace(/(\n\s*Model\s*=\s*)"[^"]*";/, `$1"${supportModel}";`)
      .replace(/(\n\s*PayloadId\s*=\s*)\d+;/, '$10;')
      .replace(/(\n\s*ModMask\s*=\s*)\d+;/, '$11;')
      .replace(/(\n\s*Fuel\s*=\s*)[^;]+;/, '$11;')
      .replace(/(\n\s*Skin\s*=\s*)"[^"]*";/, '$1"";')
      .replace(/(\n\s*BotSkin\s*=\s*)"[^"]*";/, '$1"";')
      .replace(/(\n\s*Emblem\s*=\s*)\d+;/, '$10;');
  });

  return updated;
}

function removeObjectIdsFromList(listText, objectIds) {
  const keptIds = listText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !objectIds.has(item));
  return `[${keptIds.join(',')}]`;
}

function shiftBlockXZ(block, deltaX, deltaZ) {
  const shiftValue = (original, delta) => formatNumber(Number(original) + delta);
  let updated = block;
  updated = updated.replace(/(XPos\s*=\s*)(-?\d+(?:\.\d+)?)(;)/, (match, prefix, value, suffix) => `${prefix}${shiftValue(value, deltaX)}${suffix}`);
  updated = updated.replace(/(ZPos\s*=\s*)(-?\d+(?:\.\d+)?)(;)/, (match, prefix, value, suffix) => `${prefix}${shiftValue(value, deltaZ)}${suffix}`);
  return updated;
}

function stripObjectRefsFromBlockTypes(missionText, objectIds, blockTypes) {
  let updated = missionText;

  blockTypes.forEach((blockType) => {
    const blockPattern = new RegExp(`${blockType}\\s*\\{[\\s\\S]*?\\n\\s*\\}`, 'g');
    updated = updated.replace(blockPattern, (block) =>
      block.replace(/Objects\s*=\s*\[([^\]]*)\];/, (match, contents) => `Objects = ${removeObjectIdsFromList(contents, objectIds)};`)
    );
  });

  return updated;
}

function shiftPlayerStartPackage(missionText, playerAircraft, startAirfield) {
  const templateAirfield = getTemplateStartingAirfield(playerAircraft);
  if (!startAirfield?.position || !templateAirfield?.position || startAirfield.id === templateAirfield.id) {
    return missionText;
  }

  const deltaX = startAirfield.position.x - templateAirfield.position.x;
  const deltaZ = startAirfield.position.z - templateAirfield.position.z;
  const playerEntityIds = new Set(getPlayerFlightEntityIds(missionText));
  const playerPlaneIds = new Set(getPlayerFlightPlaneIndices(missionText));
  let updated = missionText;

  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(planeBlockPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return playerPlaneIds.has(index) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
  });

  const entityPattern = /MCU_TR_Entity\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(entityPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return playerEntityIds.has(index) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
  });

  const linkedTypes = [
    'MCU_Waypoint',
    'MCU_CheckZone',
    'MCU_CMD_TakeOff',
    'MCU_CMD_Land',
    'MCU_CMD_Reposition',
    'MCU_CMD_AttackArea',
    'MCU_CMD_Cover',
    'MCU_CMD_Formation',
    'MCU_CMD_ForceComplete',
    'MCU_Activate',
    'MCU_Deactivate',
  ];

  linkedTypes.forEach((blockType) => {
    const blockPattern = new RegExp(`${blockType}\\s*\\{[\\s\\S]*?\\n\\s*\\}`, 'g');
    updated = updated.replace(blockPattern, (block) => {
      const objectsMatch = block.match(/Objects\s*=\s*\[([^\]]*)\];/);
      if (!objectsMatch) {
        return block;
      }

      const objectIds = objectsMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      return objectIds.some((item) => playerEntityIds.has(item)) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
    });
  });

  return updated;
}

function stripPlayerAutoReposition(missionText) {
  const playerEntityIds = new Set(getPlayerFlightEntityIds(missionText));
  return stripObjectRefsFromBlockTypes(missionText, playerEntityIds, ['MCU_CMD_Reposition', 'MCU_CMD_AttackArea']);
}

function shiftAmbientPackage(missionText, playerAircraft, startAirfield) {
  const templateAirfield = getTemplateStartingAirfield(playerAircraft);
  if (!startAirfield?.position || !templateAirfield?.position || startAirfield.id === templateAirfield.id) {
    return missionText;
  }

  const deltaX = startAirfield.position.x - templateAirfield.position.x;
  const deltaZ = startAirfield.position.z - templateAirfield.position.z;
  const ambientPackage = collectAmbientPackage(missionText, playerAircraft);
  let updated = missionText;

  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(planeBlockPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return ambientPackage.planeObjectIds.has(index) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
  });

  const vehicleBlockPattern = /Vehicle\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(vehicleBlockPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return ambientPackage.vehicleObjectIds.has(index) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
  });

  const blockPattern = /Block\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(blockPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return ambientPackage.blockIds.has(index) ? shiftBlockXZ(block, deltaX, deltaZ) : block;
  });

  const entityPattern = /MCU_TR_Entity\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(entityPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return ambientPackage.planeEntityIds.has(index) || ambientPackage.vehicleEntityIds.has(index)
      ? shiftBlockXZ(block, deltaX, deltaZ)
      : block;
  });

  return updated;
}

function buildStaticPlaneScript(aircraft) {
  return `LuaScripts\\WorldObjects\\BlocksDetail\\static_plane_${aircraft}.txt`;
}

function buildStaticPlaneModel(aircraft) {
  return `graphics\\blocksdetail_statics\\static_plane_${aircraft}.mgm`;
}

function applyAmbientVariation(missionText, scenario, supportAircraft, seed) {
  const config = getAmbientTemplateConfig(scenario.aircraft.player);
  if (!config) {
    return missionText;
  }

  const ambientPackage = collectAmbientPackage(missionText, scenario.aircraft.player);
  const staticPool = uniqueSorted([
    ...config.staticPlanePool,
    scenario.aircraft.player,
    supportAircraft,
  ]);
  const activeOptionalEntityIds = new Set();
  ambientPackage.optionalEntityIds.forEach((entityId, index) => {
    if (((seed + index * 11) % 5) !== 0) {
      activeOptionalEntityIds.add(entityId);
    }
  });

  let updated = missionText;

  const blockPattern = /Block\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(blockPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    if (!ambientPackage.staticPlaneBlockIds.includes(index)) {
      return block;
    }

    const replacementAircraft = pickOne(staticPool, seed + Number(index || 0));
    if (!replacementAircraft) {
      return block;
    }

    return block
      .replace(/(\n\s*Script\s*=\s*)"[^"]*";/, `$1"${buildStaticPlaneScript(replacementAircraft)}";`)
      .replace(/(\n\s*Model\s*=\s*)"[^"]*";/, `$1"${buildStaticPlaneModel(replacementAircraft)}";`);
  });

  const entityPattern = /MCU_TR_Entity\s*\{[\s\S]*?\n\s*\}/g;
  updated = updated.replace(entityPattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    if (!ambientPackage.optionalEntityIds.includes(index)) {
      return block;
    }
    const enabled = activeOptionalEntityIds.has(index) ? '1' : '0';
    return block.replace(/(\n\s*Enabled\s*=\s*)\d+;/, `$1${enabled};`);
  });

  return updated;
}

function disableTemplateAirBattleForAttackMissions(missionText, playerAircraft) {
  const playerFlight = findPlayerFlightSignature(missionText);
  const friendlyCountries = getFriendlyAlignedCountries(playerAircraft);
  const enemyCountries = getOpposingAlignedCountries(playerAircraft);
  const playerEntityIds = new Set(getPlayerFlightEntityIds(missionText));
  const planesToDisable = parsePlaneBlocks(missionText).filter((entry) => {
    const isPlayerFlight = entry.callsign === playerFlight.callsign && entry.country === playerFlight.country;
    const isAirborne = entry.startType === '0';
    const isEnemy = enemyCountries.has(entry.country);
    const isFriendlyAirborne = friendlyCountries.has(entry.country) && isAirborne && !isPlayerFlight;
    return isEnemy || isFriendlyAirborne;
  });

  const entityIdsToDisable = new Set(planesToDisable.map((entry) => entry.linkTrId).filter(Boolean));
  if (entityIdsToDisable.size === 0) {
    return missionText;
  }

  let updated = missionText;

  entityIdsToDisable.forEach((entityId) => {
    const entityPattern = new RegExp(`(MCU_TR_Entity\\s*\\{[\\s\\S]*?Index\\s*=\\s*${entityId};[\\s\\S]*?Enabled\\s*=\\s*)\\d+(;[\\s\\S]*?\\n\\s*\\})`, 'g');
    updated = updated.replace(entityPattern, '$10$2');
  });

  updated = stripObjectRefsFromBlockTypes(
    updated,
    entityIdsToDisable,
    [
      'MCU_CMD_AttackArea',
      'MCU_CMD_Cover',
      'MCU_CMD_Formation',
      'MCU_CMD_Reposition',
      'MCU_Waypoint',
      'MCU_CheckZone',
      'MCU_Activate',
      'MCU_Deactivate',
      'MCU_CMD_ForceComplete',
    ]
  );

  return updated;
}

function buildMissionTextFromTemplate({ scenario, landscape, supportAircraft, startAirfield }) {
  const weather = weatherPresets[scenario.environment.weather] || weatherPresets.Clear;
  const template = getTemplateDefinition(scenario.aircraft.player);
  let missionText = readTemplateMissionText(template.baseName);

  missionText = retargetTemplateAircraft(missionText, template.playerAircraft, scenario.aircraft.player);
  missionText = retargetFriendlySupportFlights(missionText, scenario.aircraft.player, supportAircraft);
  if (scenario.aircraft.role === 'attack') {
    missionText = stripPlayerAutoReposition(missionText);
    missionText = disableTemplateAirBattleForAttackMissions(missionText, scenario.aircraft.player);
  }
  if (scenario.coopFriendly) {
    missionText = enableCoopPlayerFlight(missionText);
  }
  missionText = applyAmbientVariation(missionText, scenario, supportAircraft, makeSeed(scenario.filters));
  missionText = shiftAmbientPackage(missionText, scenario.aircraft.player, startAirfield);
  missionText = shiftPlayerStartPackage(missionText, scenario.aircraft.player, startAirfield);
  missionText = replaceMissionOption(missionText, 'PlayerConfig', `LuaScripts\\WorldObjects\\Planes\\${scenario.aircraft.player}.txt`, true);
  missionText = replaceMissionOption(missionText, 'Time', scenario.environment.startTime);
  missionText = replaceMissionOption(missionText, 'Date', landscape.date);
  missionText = replaceMissionOption(missionText, 'HMap', normalizeMissionPath(landscape.hmap), true);
  missionText = replaceMissionOption(missionText, 'Textures', normalizeMissionPath(landscape.textures), true);
  missionText = replaceMissionOption(missionText, 'Forests', normalizeMissionPath(landscape.forests), true);
  missionText = replaceMissionOption(missionText, 'GuiMap', landscape.guimap, true);
  missionText = replaceMissionOption(missionText, 'SeasonPrefix', landscape.season_prefix, true);
  missionText = replaceMissionOption(missionText, 'CloudLevel', weather.cloudLevel);
  missionText = replaceMissionOption(missionText, 'CloudHeight', weather.cloudHeight);
  missionText = replaceMissionOption(missionText, 'PrecLevel', weather.precLevel);
  missionText = replaceMissionOption(missionText, 'PrecType', weather.precType);
  missionText = replaceMissionOption(missionText, 'CloudConfig', weather.cloudConfig, true);
  missionText = replaceMissionOption(missionText, 'Temperature', landscape.temperature);
  missionText = replaceMissionOption(missionText, 'Haze', weather.haze);
  missionText = replaceMissionOption(missionText, 'LayerFog', weather.layerFog);

  return missionText.replace(/\r?\n/g, '\r\n');
}

function buildCoopMissionText(missionText) {
  const playerFlight = findPlayerFlightSignature(missionText);
  const planeBlockPattern = /Plane\s*\{[\s\S]*?\n\s*\}/g;
  let updated = replaceMissionOption(missionText, 'MissionType', 1);

  updated = updated.replace(planeBlockPattern, (block) => {
    const callsign = extractMissionValue(block, 'Callsign');
    const country = extractMissionValue(block, 'Country');
    if (callsign !== playerFlight.callsign || country !== playerFlight.country) {
      return block;
    }

    return block.replace(/(\n\s*CoopStart\s*=\s*)\d+;/, '$11;');
  });

  return updated;
}

function setLocalizationLine(lines, index, value) {
  const prefix = `${index}:`;
  const lineIndex = lines.findIndex((line) => line.startsWith(prefix));
  if (lineIndex >= 0) {
    lines[lineIndex] = `${prefix}${value}`;
    return;
  }
  lines.push(`${prefix}${value}`);
}

function buildObjectiveText(scenario, area, chosenTargets) {
  const profile = getMissionTypeProfile(scenario.filters.targetType);
  const targetNames = chosenTargets
    .map((target) => target.display_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  const targetSummary = targetNames ? ` Primary targets: ${targetNames}.` : '';
  const escortSummary = scenario.supportAircraft ? ` Escort cover: ${scenario.supportAircraft.toUpperCase()}.` : '';
  const airfieldSummary = scenario.startAirfield ? ` Departure field: ${scenario.startAirfield.label}.` : '';
  const timeSummary = scenario.environment.startTime ? ` Takeoff time: ${formatMissionTimeLabel(scenario.environment.startTime)}.` : '';
  return `${scenario.aircraft.player.toUpperCase()} mission. ${profile.objectiveText}${targetSummary}${escortSummary}${airfieldSummary}${timeSummary}`;
}

function buildLocalizationTextFromTemplate(scenario, area, chosenTargets) {
  const template = getTemplateDefinition(scenario.aircraft.player);
  const profile = getMissionTypeProfile(scenario.filters.targetType);
  const lines = readTemplateLocalizationText(template.baseName).replace(/\r\n/g, '\n').split('\n');
  const briefing = buildObjectiveText(scenario, area, chosenTargets);
  const missionComplete = `${scenario.filters.targetType} completed.`;
  const enemyActivity = `${profile.ingressText} Enemy ${scenario.filters.enemyFaction} opposition expected in the target area.`;
  const departureAirfield = scenario.startAirfield?.label || 'base';
  const recovery = `${profile.recoveryText} Recover at ${departureAirfield}.`;

  setLocalizationLine(lines, 0, `Scenario - ${scenario.title}`);
  setLocalizationLine(lines, 1, briefing);
  setLocalizationLine(lines, 2, 'Codex');

  [
    226, 228, 230, 232, 234, 236, 238, 240, 242, 244, 246, 248, 252, 254, 256, 258, 263, 267,
  ].forEach((index) => {
    setLocalizationLine(lines, index, profile.iconText);
  });

  setLocalizationLine(lines, 210, `Take off from ${departureAirfield}. ${profile.commandText}`);
  setLocalizationLine(lines, 211, profile.ingressText);
  setLocalizationLine(lines, 212, profile.commandText);
  setLocalizationLine(lines, 213, enemyActivity);
  setLocalizationLine(lines, 218, recovery);
  setLocalizationLine(lines, 219, 'Proceed with landing approach.');
  setLocalizationLine(lines, 220, 'Taxi to the parking area.');
  setLocalizationLine(lines, 23, missionComplete);
  setLocalizationLine(lines, 24, missionComplete);
  setLocalizationLine(lines, 261, missionComplete);
  setLocalizationLine(lines, 262, missionComplete);
  setLocalizationLine(lines, 266, enemyActivity);
  setLocalizationLine(lines, 268, enemyActivity);
  setLocalizationLine(lines, 269, missionComplete);
  setLocalizationLine(lines, 271, enemyActivity);
  setLocalizationLine(lines, 272, recovery);

  return `${lines.join('\r\n')}\r\n`;
}

function buildCoopSdsText(scenario, relativeMissionPath) {
  const serverName = `${scenario.title} COOP`;
  const serverDesc = buildObjectiveText(scenario, null, []).replace(/"/g, "'");
  const missionRef = relativeMissionPath.replace(/\.Mission$/i, '').split('/').join('\\');

  return `// Generated by IL-2 Korea Scenario Generator

// credentials

login = ""
password = ""

// server info

ranked = 0
mode = 2
banTimeout = 300
lobbyTimer = 0
coopQuorum = 0
allowMouseJoy = 1
ServerName = "${serverName}"
TacviewRecord = true

serverDesc = "${serverDesc}"

// SRS comm server IP:Port ("255.255.255.255:1234") or URL:Port ("srs.comm.host.com:1234")
srsCommServer = ""

// connection settings

protection = ""
maxClients = 8
maxClientPing = -1
ExternalIP = 1
ServerIP = ""
DownloadLimit = 50000
UploadLimit = 50000
DownloaderPort = 28100
TCPPort = 28001
UDPPort = 28001

// remote console settings

RconStart = 0
RconIP = "127.0.0.1"
RconPort = 8991
RconLogin = ""
RconPassword = ""

// mission rotation data

ShutdownLoads = -1

[rotation]
random = false
   file = "${missionRef}"
[end]

// preset and advanced settings

preset = 1
killNotification = 1
friendlyFireReturn = 1
finishMissionIfLanded = 0
lockPayloads = 0
lockSkins = 0
lockFuelLoads = 0
lockWeaponModes = 0
lockPlayerTankAIaimAtObj = 0
lockInjectors = 0
allowSpectatorcameras = true
penaltyTimeout = 10
respawnTimeout = 10
coalitionChangeTimeout = 10
finishMissionTimeout = 15
missionEndTimeout = 60
idleKickTimeout = 300
tdmPointsPerRound = 500
tdmRoundTime = -1
coalitionsBalancer = true
allowMarshals = true
useMarshalsRestriction = true
objectIcons = true
navigationIcons = true
aimingHelp = false
courseWeaponsAimingHelp = false
padlock = true
simpleDevices = true
techChatMessages = true
techChatAdvices = false
AllowExtCamPlayer = true
easyFlight = false
autoCoordination = false
autoThrottle = false
autoPilot = true
autoThrottleLimit = true
autoMix = true
autoRadiator = true
noMoment = false
noWind = false
noMisfire = false
noBreak = false
invulnerability = false
simplePhysiology = false
unlimitFuel = false
unlimitAmmo = false
engineNoStop = false
alterVisibility = false
`;
}

function getLocalServerSetupPaths() {
  if (!fs.existsSync(il2NsDataUserRoot)) {
    return [];
  }

  return fs
    .readdirSync(il2NsDataUserRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(il2NsDataUserRoot, entry.name, 'LocalServerSetup.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function registerCoopMissionInLocalServerSetup(relativeMissionPaths) {
  const normalizedPaths = [...new Set(relativeMissionPaths.map((entry) => String(entry).replace(/\\/g, '/')))];
  const setupPaths = getLocalServerSetupPaths();

  setupPaths.forEach((setupPath) => {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(setupPath, 'utf8'));
    } catch (error) {
      return;
    }

    if (!parsed.mode2 || typeof parsed.mode2 !== 'object') {
      parsed.mode2 = {};
    }

    const existing = Array.isArray(parsed.mode2.rotationMissions) ? parsed.mode2.rotationMissions : [];
    const merged = [...existing];
    normalizedPaths.forEach((missionPath) => {
      if (!merged.includes(missionPath)) {
        merged.push(missionPath);
      }
    });

    parsed.mode2.rotationMissions = merged;
    fs.writeFileSync(setupPath, JSON.stringify(parsed), 'utf8');
  });
}

function buildScenario(input, options = {}) {
  const exportToGame = options.exportToGame !== false;
  const catalog = readCatalog();
  const seed = makeSeed(input);
  const missionCatalog = catalog.mission_object_catalog || [];
  const landscapes = catalog.landscape_templates || [];
  const friendlyFaction = getAircraftCoalition(input.aircraft);
  const enemyFaction = getOpposingCoalition(input.aircraft) || input.enemyFaction || null;

  const landscape = landscapes.find((item) => item.landscape === input.landscape) || null;
  if (!landscape) {
    throw new Error(`Unknown landscape: ${input.landscape}`);
  }

  const targetPool = buildTargetPool(missionCatalog, input, enemyFaction);
  if (targetPool.length === 0) {
    throw new Error(
      `No valid ${input.targetType} targets found for ${input.aircraft.toUpperCase()} against ${enemyFaction || 'the selected enemy faction'}.`
    );
  }

  const chosenTargets = chooseTargets(targetPool, seed);
  const area = getMissionArea(input.targetType);
  const profile = getMissionTypeProfile(input.targetType);
  const role = input.targetType.includes('Strike') || input.targetType.includes('Attack') ? 'attack' : 'fighter';
  const supportAircraft = chooseSupportAircraft(input.aircraft, role, seed);
  const startAirfield = getSelectedStartingAirfield(input.aircraft, input.startAirfield);
  const startTime = input.startTime || '09:00:0';
  const coopFriendly = normalizeBoolean(input.coopFriendly);

  const scenario = {
    createdAt: new Date().toISOString(),
    title: `${input.aircraft.toUpperCase()} ${input.targetType}`,
    summary: `${input.aircraft.toUpperCase()} sortie over ${input.landscape} against ${enemyFaction}.`,
    filters: {
      ...input,
      friendlyFaction,
      enemyFaction,
    },
    environment: {
      landscape: input.landscape,
      templateDate: landscape.date,
      templateTemperature: landscape.temperature,
      seasonPrefix: landscape.season_prefix,
      weather: input.weather,
      startTime,
      targetArea: area.anchor,
    },
    aircraft: {
      player: input.aircraft,
      faction: friendlyFaction,
      role,
    },
    supportAircraft,
    startAirfield,
    coopFriendly,
    missionProfile: profile,
    targets: chosenTargets.map((entry) => ({
      category: entry.category,
      displayName: entry.display_name,
      scriptPath: entry.script_path,
      modelPath: entry.model_path,
      faction: entry.historical_faction_guess,
      sourceMissions: entry.source_missions,
    })),
    notes: [
      'Playable mission package exported as .Mission and .eng.',
      `Mission graph cloned from stock template ${getTemplateDefinition(input.aircraft).baseName}.`,
      `Mission type profile applied: ${input.targetType}.`,
      `Friendly support flights retargeted to ${supportAircraft.toUpperCase()}.`,
      `Starting airfield: ${startAirfield.label}.`,
      `Start time: ${startTime}.`,
      coopFriendly ? 'COOP-friendly player flight enabled.' : 'Single-seat player flight export.',
    ],
  };

  const missionText = buildMissionTextFromTemplate({ scenario, landscape, supportAircraft, startAirfield });
  const coopMissionText = coopFriendly ? buildCoopMissionText(missionText) : null;
  const localizationText = buildLocalizationTextFromTemplate(scenario, area, chosenTargets);
  const localizationBuffer = Buffer.from(`\uFEFF${localizationText}`, 'utf16le');

  fs.mkdirSync(generatedRoot, { recursive: true });
  if (exportToGame) {
    fs.mkdirSync(il2MissionExportRoot, { recursive: true });
    if (coopFriendly) {
      fs.mkdirSync(il2MultiplayerRoot, { recursive: true });
      fs.mkdirSync(il2CoopExportRoot, { recursive: true });
      fs.mkdirSync(il2CooperativeExportRoot, { recursive: true });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  const baseName = `${stamp}_${safeTitle}`;

  const jsonOutputPath = path.join(generatedRoot, `${baseName}.json`);
  const missionOutputPath = path.join(generatedRoot, `${baseName}.Mission`);
  const engOutputPath = path.join(generatedRoot, `${baseName}.eng`);
  const exportMissionPath = exportToGame ? path.join(il2MissionExportRoot, `${baseName}.Mission`) : null;
  const exportEngPath = exportToGame ? path.join(il2MissionExportRoot, `${baseName}.eng`) : null;
  const coopExportMissionPath = exportToGame && coopFriendly ? path.join(il2CoopExportRoot, `${baseName}.Mission`) : null;
  const coopExportEngPath = exportToGame && coopFriendly ? path.join(il2CoopExportRoot, `${baseName}.eng`) : null;
  const coopRootExportMissionPath = exportToGame && coopFriendly ? path.join(il2MultiplayerRoot, `${baseName}.Mission`) : null;
  const coopRootExportEngPath = exportToGame && coopFriendly ? path.join(il2MultiplayerRoot, `${baseName}.eng`) : null;
  const coopExportSdsPath = exportToGame && coopFriendly ? path.join(il2CoopExportRoot, `${baseName}.sds`) : null;
  const coopRootExportSdsPath = exportToGame && coopFriendly ? path.join(il2MultiplayerRoot, `${baseName}.sds`) : null;
  const cooperativeMissionDir = exportToGame && coopFriendly ? path.join(il2CooperativeExportRoot, baseName) : null;
  const cooperativeExportMissionPath =
    exportToGame && coopFriendly ? path.join(cooperativeMissionDir, `${baseName}.Mission`) : null;
  const cooperativeExportEngPath =
    exportToGame && coopFriendly ? path.join(cooperativeMissionDir, `${baseName}.eng`) : null;
  const cooperativeExportSdsPath =
    exportToGame && coopFriendly ? path.join(cooperativeMissionDir, `${baseName}.sds`) : null;

  fs.writeFileSync(jsonOutputPath, `${JSON.stringify(scenario, null, 2)}\n`, 'utf8');
  fs.writeFileSync(missionOutputPath, missionText, 'utf8');
  fs.writeFileSync(engOutputPath, localizationBuffer);
  if (exportToGame) {
    fs.writeFileSync(exportMissionPath, missionText, 'utf8');
    fs.writeFileSync(exportEngPath, localizationBuffer);
    if (coopFriendly) {
      const coopSdsTextForCoopFolder = buildCoopSdsText(scenario, `${baseName}.Mission`);
      const coopSdsTextForRootFolder = buildCoopSdsText(scenario, `COOP/${baseName}.Mission`);
      const coopSdsTextForCooperativeFolder = buildCoopSdsText(
        scenario,
        `Cooperative/${baseName}/${baseName}.Mission`
      );

      fs.mkdirSync(cooperativeMissionDir, { recursive: true });
      fs.writeFileSync(coopExportMissionPath, coopMissionText, 'utf8');
      fs.writeFileSync(coopExportEngPath, localizationBuffer);
      fs.writeFileSync(coopRootExportMissionPath, coopMissionText, 'utf8');
      fs.writeFileSync(coopRootExportEngPath, localizationBuffer);
      fs.writeFileSync(coopExportSdsPath, coopSdsTextForCoopFolder, 'utf8');
      fs.writeFileSync(coopRootExportSdsPath, coopSdsTextForRootFolder, 'utf8');
      fs.writeFileSync(cooperativeExportMissionPath, coopMissionText, 'utf8');
      fs.writeFileSync(cooperativeExportEngPath, localizationBuffer);
      fs.writeFileSync(cooperativeExportSdsPath, coopSdsTextForCooperativeFolder, 'utf8');
      registerCoopMissionInLocalServerSetup([
        `Multiplayer/Cooperative/${baseName}/${baseName}`,
        `Multiplayer/${baseName}`,
        `Multiplayer/COOP/${baseName}`,
      ]);
    }
  }

  return {
    scenario,
    outputPath: jsonOutputPath,
    missionOutputPath,
    engOutputPath,
    exportMissionPath,
    exportEngPath,
    coopExportMissionPath,
    coopExportEngPath,
    coopRootExportMissionPath,
    coopRootExportEngPath,
    coopExportSdsPath,
    coopRootExportSdsPath,
    cooperativeExportMissionPath,
    cooperativeExportEngPath,
    cooperativeExportSdsPath,
  };
}

module.exports = {
  buildOptions,
  buildScenario,
};
