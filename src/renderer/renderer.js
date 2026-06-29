const form = document.getElementById('scenario-form');
const result = document.getElementById('result');
const status = document.getElementById('status');
let appOptions = null;

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
  const startTimeSelect = document.getElementById('startTime');
  if (startTimeSelect.options.length) {
    startTimeSelect.value = '08:00:0';
  }
  syncEnemyFaction();
  syncStartingAirfield();
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
  const airfields = (appOptions.startingAirfields || []).filter(
    (entry) => entry.coalition === 'any' || entry.coalition === coalition
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

document.getElementById('aircraft').addEventListener('change', () => {
  syncEnemyFaction();
  syncStartingAirfield();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
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
