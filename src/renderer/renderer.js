const form = document.getElementById('scenario-form');
const result = document.getElementById('result');
const status = document.getElementById('status');
const experimentalTargetTypes = new Set(['Airfield Strike']);
const frontLineStorageKey = 'il2korea.frontLine';
let appOptions = null;

function getStoredFrontLine() {
  const raw = window.localStorage.getItem(frontLineStorageKey);
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : null;
}

function describeFrontLine(value) {
  if (value <= 20) return 'UN push north';
  if (value <= 40) return 'UN advantage';
  if (value <= 60) return 'Mid-conflict stalemate';
  if (value <= 80) return 'Communist advantage';
  return 'Communist push south';
}

function updateFrontLineLabel() {
  const slider = document.getElementById('frontLine');
  const value = Number(slider.value);
  document.getElementById('frontLineLabel').textContent = `${value} • ${describeFrontLine(value)}`;
}

function isAirfieldAvailable(entry, coalition, frontLine) {
  if (entry.id === 'auto') {
    return true;
  }

  const windows = Array.isArray(entry.ownership) ? entry.ownership : [];
  if (!windows.length) {
    return entry.coalition === coalition;
  }

  return windows.some(
    (window) =>
      window.coalition === coalition &&
      frontLine >= Number(window.minFrontLine) &&
      frontLine <= Number(window.maxFrontLine)
  );
}

function fillSelect(elementId, items, options = {}) {
  const select = document.getElementById(elementId);
  select.innerHTML = '';

  const values = options.includeAny ? ['Any', ...items] : items;
  values.forEach((value) => {
    const option = document.createElement('option');
    if (typeof value === 'object' && value !== null) {
      option.value = value.value ?? value.id ?? '';
      option.textContent = value.label ?? value.text ?? value.value ?? value.id ?? '';
    } else {
      option.value = value;
      option.textContent = value;
    }
    select.appendChild(option);
  });
}

async function loadOptions() {
  appOptions = await window.scenarioApp.getOptions();
  fillSelect('aircraft', appOptions.aircraft);
  fillSelect('targetType', appOptions.targetTypes);
  fillSelect('landscape', appOptions.landscapes);
  fillSelect('startTime', appOptions.startTimes || []);
  const frontLineSlider = document.getElementById('frontLine');
  const storedFrontLine = getStoredFrontLine();
  frontLineSlider.value = storedFrontLine ?? appOptions.defaultFrontLineState ?? 50;
  updateFrontLineLabel();
  const startTimeSelect = document.getElementById('startTime');
  if (startTimeSelect.options.length) {
    startTimeSelect.value = '08:00:0';
  }
  syncEnemyFaction();
  syncStartingAirfield();
  syncGeneratorMode();
  status.textContent = appOptions.installInfo?.detected
    ? `Catalog ready. IL-2 detected at ${appOptions.installInfo.installRoot}.`
    : 'Catalog ready. IL-2 install not detected yet.';
}

function syncEnemyFaction() {
  if (!appOptions) {
    return;
  }

  const aircraft = document.getElementById('aircraft').value || appOptions.aircraft[0];
  const coalition = appOptions.aircraftCoalitions?.[aircraft];
  const opposing = coalition ? appOptions.coalitionOpposites?.[coalition] : null;
  const enemyFactionSelect = document.getElementById('enemyFaction');

  if (opposing) {
    fillSelect('enemyFaction', [opposing]);
    enemyFactionSelect.value = opposing;
    enemyFactionSelect.disabled = true;
  } else {
    fillSelect('enemyFaction', appOptions.factions);
    enemyFactionSelect.disabled = false;
  }
}

function syncStartingAirfield() {
  if (!appOptions) {
    return;
  }

  const aircraft = document.getElementById('aircraft').value || appOptions.aircraft[0];
  const coalition = appOptions.aircraftCoalitions?.[aircraft];
  const frontLine = Number(document.getElementById('frontLine').value || appOptions.defaultFrontLineState || 50);
  const airfields = (appOptions.startingAirfields || []).filter(
    (entry) => isAirfieldAvailable(entry, coalition, frontLine)
  );
  const select = document.getElementById('startAirfield');
  select.innerHTML = '';

  airfields.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.label;
    select.appendChild(option);
  });

  if (airfields.some((entry) => entry.id === 'auto')) {
    select.value = 'auto';
  }
}

function syncGeneratorMode() {
  const checkbox = document.getElementById('useScratchBuilder');
  const label = document.getElementById('generator-mode-label');
  checkbox.checked = false;
  checkbox.disabled = true;
  label.textContent = 'Experimental generator temporarily disabled';
}

document.getElementById('aircraft').addEventListener('change', () => {
  syncEnemyFaction();
  syncStartingAirfield();
});

document.getElementById('targetType').addEventListener('change', () => {
  syncGeneratorMode();
});

document.getElementById('frontLine').addEventListener('input', () => {
  updateFrontLineLabel();
  syncStartingAirfield();
});

document.getElementById('frontLine').addEventListener('change', () => {
  const value = document.getElementById('frontLine').value;
  window.localStorage.setItem(frontLineStorageKey, value);
  syncStartingAirfield();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.coopFriendly = document.getElementById('coopFriendly').checked;
  payload.useScratchBuilder = document.getElementById('useScratchBuilder').checked;
  payload.frontLine = Number(document.getElementById('frontLine').value);
  status.textContent = 'Generating scenario...';

  try {
    const output = await window.scenarioApp.generateScenario(payload);
    result.textContent = JSON.stringify(
      {
        outputPath: output.outputPath,
        missionOutputPath: output.missionOutputPath,
        engOutputPath: output.engOutputPath,
        exportMissionPath: output.exportMissionPath,
        exportEngPath: output.exportEngPath,
        coopExportMissionPath: output.coopExportMissionPath,
        coopExportEngPath: output.coopExportEngPath,
        coopRootExportMissionPath: output.coopRootExportMissionPath,
        coopRootExportEngPath: output.coopRootExportEngPath,
        coopExportSdsPath: output.coopExportSdsPath,
        coopRootExportSdsPath: output.coopRootExportSdsPath,
        cooperativeExportMissionPath: output.cooperativeExportMissionPath,
        cooperativeExportEngPath: output.cooperativeExportEngPath,
        cooperativeExportSdsPath: output.cooperativeExportSdsPath,
        scenario: output.scenario,
      },
      null,
      2
    );
    status.textContent = output.coopExportMissionPath
      ? 'Scenario package written locally, copied to Missions\\CodexGenerated, and copied to Multiplayer root, Multiplayer\\COOP, and Multiplayer\\Cooperative\\<MissionName> with SDS files.'
      : 'Scenario package written locally and copied to IL-2 Missions\\CodexGenerated.';
  } catch (error) {
    result.textContent = error?.stack || String(error);
    status.textContent = 'Generation failed.';
  }
});

loadOptions().catch((error) => {
  result.textContent = error?.stack || String(error);
  status.textContent = 'Failed to load catalog.';
});
