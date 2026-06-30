const fs = require('fs');
const path = require('path');
const { buildScratchMissionText, buildScratchLocalizationText } = require('./scratchMissionBuilder');

const workspaceRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(workspaceRoot, 'catalog', 'il2_korea_catalog.json');
const frontLineAirfieldsPath = path.join(workspaceRoot, 'catalog', 'front_line_airfields.json');
const il2TemplateMissionSentinel = path.join('game', 'data', 'Missions', '[DEMO]InchonStrike.Mission');
let cachedInstallInfo = null;
let cachedCatalog = null;
let cachedLandscapeGroups = null;
let cachedLandscapeObjects = null;
let cachedFrontLineAirfields = null;

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

const scratchBuilderMissionTypes = new Set([
  'Airfield Strike',
  'Bridge Strike',
  'Ground Attack',
  'Harbor Strike',
  'Industrial Strike',
  'Rail Interdiction',
  'Troop Area Strike',
]);

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

const excludedLandscapeGroupNames = new Set([
  'Group',
  'AIRFIELDS',
  'BRIDGES_HH',
  'BRIDGES_RR',
  'CITIES',
  'DAMS',
  'FULLSCENE',
  'INDUSTRY_PORTS',
  'MARKS',
  'MILITARY_CAMP',
  'MINES',
  'RW_STATIONS',
  'TUNNELS',
]);

const missionTargetFamilies = {
  'Airfield Strike': [
    {
      id: 'parked_aircraft_sweep',
      label: 'Parked Aircraft Sweep',
      source: { kind: 'group', categories: ['airfield_zone'] },
      targetHints: ['static_plane_', 'arf_hangar', 'arf_tower', 'fuel', 'ammo'],
      supportLevel: 'escort',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Hit parked aircraft, revetments, and support areas in a single fast pass sequence.',
      ingressText: 'Expect runway-adjacent light flak, fuel fires, and alert fighters near the field.',
    },
    {
      id: 'hangar_fuel_suppression',
      label: 'Hangar and Fuel Suppression',
      source: { kind: 'group', categories: ['airfield_zone'] },
      targetHints: ['hangar', 'nissenhut', 'fuel', 'cistern', 'warehouse'],
      supportLevel: 'light',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Concentrate on hangars, fuel storage, and maintenance infrastructure.',
      ingressText: 'Expect dispersed anti-aircraft positions and support vehicles around the perimeter.',
    },
  ],
  'Bridge Strike': [
    {
      id: 'road_bridge_chokepoint',
      label: 'Road Bridge Chokepoint',
      source: { kind: 'object', categories: ['road_bridge'] },
      targetHints: ['bridge', 'road'],
      supportLevel: 'light',
      defenseDensity: 'light',
      targetCount: 2,
      commandText: 'Attack the crossing spans and road approaches to choke enemy movement.',
      ingressText: 'Expect light flak and small-arms fire from the bridge banks and nearby roads.',
    },
    {
      id: 'rail_bridge_cut',
      label: 'Rail Bridge Cut',
      source: { kind: 'object', categories: ['rail_bridge'] },
      targetHints: ['bridge', 'rail', 'rw_'],
      supportLevel: 'escort',
      defenseDensity: 'medium',
      targetCount: 2,
      commandText: 'Break the rail span and sever the line feeding the front.',
      ingressText: 'Expect defensive fire along the rail embankment and at adjacent service tracks.',
    },
  ],
  'Ground Attack': [
    {
      id: 'vehicle_park_sweep',
      label: 'Vehicle Park Sweep',
      source: { kind: 'group', categories: ['military_camp_zone', 'city_zone'] },
      targetHints: ['truck', 'car', 'aaa', 'mg', 'gun', 'tent'],
      supportLevel: 'light',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Work through the vehicle park and nearby defensive positions.',
      ingressText: 'Expect scattered automatic weapons and transport vehicles spread through the area.',
    },
    {
      id: 'frontline_support_bust',
      label: 'Frontline Support Bust',
      source: { kind: 'group', categories: ['military_camp_zone', 'tunnel_zone'] },
      targetHints: ['ammo', 'tent', 'dugout', 'gun', 'truck'],
      supportLevel: 'none',
      defenseDensity: 'light',
      targetCount: 3,
      commandText: 'Attack stores, dugouts, and support transport around the forward position.',
      ingressText: 'Enemy resistance should be light but close to the ground and easy to miss on ingress.',
    },
  ],
  'Harbor Strike': [
    {
      id: 'dockyard_warehouses',
      label: 'Dockyard Warehouses',
      source: { kind: 'group', categories: ['industrial_port_zone'] },
      targetHints: ['port_', 'shipyard', 'warehouse', 'storage', 'crane'],
      supportLevel: 'escort',
      defenseDensity: 'heavy',
      targetCount: 3,
      commandText: 'Strike dockside storage, cranes, and harbor support infrastructure.',
      ingressText: 'Expect concentrated anti-aircraft fire near the waterfront and dockyard approaches.',
    },
    {
      id: 'shipping_and_fuel',
      label: 'Shipping and Fuel',
      source: { kind: 'group', categories: ['industrial_port_zone'] },
      targetHints: ['ship', 'port_', 'fuel', 'cistern', 'storage'],
      supportLevel: 'escort',
      defenseDensity: 'heavy',
      targetCount: 3,
      commandText: 'Hit shipping support points, fuel stores, and loading areas in the harbor zone.',
      ingressText: 'Waterfront guns and alert defense crews are likely around piers and fuel depots.',
    },
  ],
  'Industrial Strike': [
    {
      id: 'factory_block_raid',
      label: 'Factory Block Raid',
      source: { kind: 'group', categories: ['industrial_port_zone', 'city_zone', 'mine_zone'] },
      targetHints: ['factory', 'warehouse', 'storage', 'power', 'ind_'],
      supportLevel: 'escort',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Attack the production blocks and warehouse rows feeding enemy operations.',
      ingressText: 'Expect medium flak and concentrated smoke or dust around industrial buildings.',
    },
    {
      id: 'mine_processing_strike',
      label: 'Mine Processing Strike',
      source: { kind: 'group', categories: ['mine_zone'] },
      targetHints: ['mine', 'warehouse', 'storage', 'logs', 'planks'],
      supportLevel: 'light',
      defenseDensity: 'light',
      targetCount: 3,
      commandText: 'Suppress mine works, processing sheds, and nearby stockpiles.',
      ingressText: 'Defenses are likely lighter here, but targets may be spread across a wider work site.',
    },
  ],
  'Rail Interdiction': [
    {
      id: 'marshalling_yard_hit',
      label: 'Marshalling Yard Hit',
      source: { kind: 'group', categories: ['railway_station_zone'] },
      targetHints: ['rw_', 'rail', 'train', 'controltower', 'coaltower'],
      supportLevel: 'light',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Hit the station area, yard structures, and rail service points.',
      ingressText: 'Expect defenses near sidings, control towers, and yard support buildings.',
    },
    {
      id: 'tunnel_and_track_cut',
      label: 'Tunnel and Track Cut',
      source: { kind: 'group', categories: ['tunnel_zone', 'railway_station_zone'] },
      targetHints: ['rw_', 'tunnel', 'rail', 'bridge'],
      supportLevel: 'none',
      defenseDensity: 'light',
      targetCount: 2,
      commandText: 'Disrupt the rail corridor around the tunnel approaches and choke points.',
      ingressText: 'Enemy resistance should be intermittent but terrain masking will complicate your run-in.',
    },
  ],
  'Troop Area Strike': [
    {
      id: 'camp_suppression',
      label: 'Camp Suppression',
      source: { kind: 'group', categories: ['military_camp_zone'] },
      targetHints: ['tent', 'barrack', 'truck', 'ammo', 'dugout'],
      supportLevel: 'light',
      defenseDensity: 'medium',
      targetCount: 3,
      commandText: 'Attack troop shelters, stores, and assembly points inside the camp perimeter.',
      ingressText: 'Expect small-caliber fire from dispersed positions and parked vehicles.',
    },
    {
      id: 'staging_area_strike',
      label: 'Staging Area Strike',
      source: { kind: 'group', categories: ['military_camp_zone', 'city_zone'] },
      targetHints: ['truck', 'car', 'tent', 'ammo', 'gun'],
      supportLevel: 'none',
      defenseDensity: 'light',
      targetCount: 3,
      commandText: 'Sweep the staging area for troop concentrations and transport support assets.',
      ingressText: 'The target may be loosely organized, with defenses clustered around key vehicles or supplies.',
    },
  ],
};

const startTimePresets = [
  { value: '05:30:0', label: 'Dawn 05:30' },
  { value: '08:00:0', label: 'Morning 08:00' },
  { value: '12:00:0', label: 'Noon 12:00' },
  { value: '15:00:0', label: 'Afternoon 15:00' },
  { value: '18:30:0', label: 'Dusk 18:30' },
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
  if (!cachedCatalog) {
    const raw = fs.readFileSync(catalogPath, 'utf8').replace(/^\uFEFF/, '');
    cachedCatalog = JSON.parse(raw);
  }

  return cachedCatalog;
}

function readCatalogDataFile(relativePath) {
  const fullPath = path.join(path.dirname(catalogPath), relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function readFrontLineAirfields() {
  if (!cachedFrontLineAirfields) {
    const raw = fs.readFileSync(frontLineAirfieldsPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    cachedFrontLineAirfields = {
      defaultFrontLineState: Number(parsed.defaultFrontLineState) || 50,
      startingAirfields: Array.isArray(parsed.startingAirfields) ? parsed.startingAirfields : [],
    };
  }

  return cachedFrontLineAirfields;
}

function getDefaultFrontLineState() {
  return readFrontLineAirfields().defaultFrontLineState;
}

function getStartingAirfields() {
  return readFrontLineAirfields().startingAirfields;
}

function readLandscapeGroups() {
  const catalog = readCatalog();
  const relativePath = catalog.landscape_data_files?.group_catalog_json || catalog.landscape_data_files?.group_json;
  if (!relativePath) {
    return [];
  }

  if (!cachedLandscapeGroups) {
    cachedLandscapeGroups = readCatalogDataFile(relativePath);
  }

  return cachedLandscapeGroups;
}

function readLandscapeObjects() {
  const catalog = readCatalog();
  const relativePath = catalog.landscape_data_files?.object_catalog_json || catalog.landscape_data_files?.object_json;
  if (!relativePath) {
    return [];
  }

  if (!cachedLandscapeObjects) {
    cachedLandscapeObjects = readCatalogDataFile(relativePath);
  }

  return cachedLandscapeObjects;
}

function getElectronAppSafe() {
  try {
    const electron = require('electron');
    return electron?.app || null;
  } catch (error) {
    return null;
  }
}

function getGeneratedRoot() {
  const electronApp = getElectronAppSafe();
  if (electronApp && electronApp.isPackaged) {
    return path.join(electronApp.getPath('userData'), 'generated');
  }

  return path.join(workspaceRoot, 'generated');
}

function fileExists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function directoryExists(targetPath) {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch (error) {
    return false;
  }
}

function parseSteamLibraryFolders(vdfPath) {
  if (!fileExists(vdfPath)) {
    return [];
  }

  const raw = fs.readFileSync(vdfPath, 'utf8');
  const matches = [...raw.matchAll(/"path"\s*"([^"]+)"/g)];
  return matches.map((match) => match[1].replace(/\\\\/g, '\\'));
}

function buildInstallInfo(installRoot, source) {
  const gameRoot = path.join(installRoot, 'game');
  const dataRoot = path.join(gameRoot, 'data');
  return {
    detected: true,
    source,
    installRoot,
    gameRoot,
    dataRoot,
    missionTemplateRoot: path.join(dataRoot, 'Missions'),
    missionExportRoot: path.join(dataRoot, 'Missions', 'CodexGenerated'),
    multiplayerRoot: path.join(dataRoot, 'Multiplayer'),
    coopExportRoot: path.join(dataRoot, 'Multiplayer', 'COOP'),
    cooperativeExportRoot: path.join(dataRoot, 'Multiplayer', 'Cooperative'),
    nsDataUserRoot: path.join(dataRoot, 'NSData', 'UserData'),
  };
}

function detectIl2Install() {
  if (cachedInstallInfo) {
    return cachedInstallInfo;
  }

  const envCandidates = [
    { root: process.env.IL2_KOREA_INSTALL_DIR, source: 'env:IL2_KOREA_INSTALL_DIR' },
    { root: process.env.IL2SERIES_HOME, source: 'env:IL2SERIES_HOME' },
  ].filter((entry) => entry.root);

  const programFilesCandidates = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
  ]
    .filter(Boolean)
    .map((basePath) => ({ root: path.join(basePath, 'IL2Series'), source: `default:${basePath}` }));

  const steamRootCandidates = [
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'], 'Steam') : null,
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'Steam') : null,
  ].filter(Boolean);

  const steamLibraryCandidates = [];
  steamRootCandidates.forEach((steamRoot) => {
    const directRoot = path.join(steamRoot, 'steamapps', 'common', 'IL2Series');
    steamLibraryCandidates.push({ root: directRoot, source: `steam:${steamRoot}` });

    const libraryFile = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
    parseSteamLibraryFolders(libraryFile).forEach((libraryRoot) => {
      steamLibraryCandidates.push({
        root: path.join(libraryRoot, 'steamapps', 'common', 'IL2Series'),
        source: `steam-library:${libraryRoot}`,
      });
    });
  });

  const orderedCandidates = [...envCandidates, ...programFilesCandidates, ...steamLibraryCandidates];
  const seen = new Set();

  for (const candidate of orderedCandidates) {
    const normalizedRoot = path.resolve(candidate.root);
    if (seen.has(normalizedRoot)) {
      continue;
    }
    seen.add(normalizedRoot);

    const sentinelPath = path.join(normalizedRoot, il2TemplateMissionSentinel);
    if (fileExists(sentinelPath)) {
      cachedInstallInfo = buildInstallInfo(normalizedRoot, candidate.source);
      return cachedInstallInfo;
    }
  }

  cachedInstallInfo = {
    detected: false,
    source: null,
    installRoot: null,
    gameRoot: null,
    dataRoot: null,
    missionTemplateRoot: null,
    missionExportRoot: null,
    multiplayerRoot: null,
    coopExportRoot: null,
    cooperativeExportRoot: null,
    nsDataUserRoot: null,
  };
  return cachedInstallInfo;
}

function requireIl2Install() {
  const installInfo = detectIl2Install();
  if (!installInfo.detected) {
    throw new Error(
      'IL-2 Korea install not found. Set IL2_KOREA_INSTALL_DIR to the game root or install IL-2 Korea in a supported location.'
    );
  }
  return installInfo;
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
  const installInfo = detectIl2Install();
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
    defaultFrontLineState: getDefaultFrontLineState(),
    startingAirfields: getStartingAirfields(),
    aircraftCoalitions,
    coalitionOpposites,
    installInfo,
  };
}

function pickOne(items, seed) {
  if (!items.length) return null;
  const index = Math.abs(seed) % items.length;
  return items[index];
}

function makeSeed(input) {
  return `${input.aircraft}|${input.targetType}|${input.landscape}|${input.enemyFaction}|${input.weather}|${normalizeFrontLineValue(input.frontLine)}`
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function normalizeFrontLineValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return getDefaultFrontLineState();
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function describeFrontLineState(value) {
  const normalized = normalizeFrontLineValue(value);
  if (normalized <= 20) {
    return 'UN push north';
  }
  if (normalized <= 40) {
    return 'UN advantage';
  }
  if (normalized <= 60) {
    return 'Mid-conflict stalemate';
  }
  if (normalized <= 80) {
    return 'Communist advantage';
  }
  return 'Communist push south';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatLocationLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveLocationLabel(entry, fallbackCategory) {
  const rawCandidates = [
    entry.group_name,
    ...(String(entry.group_path || '')
      .split('>')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .reverse()),
    entry.root_group,
  ];

  const useful = rawCandidates.find((candidate) => {
    const normalized = String(candidate || '').trim();
    return normalized && !excludedLandscapeGroupNames.has(normalized) && normalized !== 'Group';
  });

  return formatLocationLabel(useful || fallbackCategory || 'Target Area');
}

function isUsefulLandscapeGroup(entry) {
  const groupName = String(entry.group_name || '').trim();
  if (!groupName || excludedLandscapeGroupNames.has(groupName)) {
    return false;
  }

  const normalizedGroupName = groupName.toLowerCase();
  if (normalizedGroupName.endsWith('_ambient')) {
    return false;
  }

  return entry.object_count >= 3;
}

function matchesFactionPreference(entry, enemyFaction) {
  if (!enemyFaction) {
    return true;
  }

  const faction = entry.historical_faction_guess;
  return faction === enemyFaction || faction === 'terrain/static' || faction === 'unknown';
}

function isAirfieldOwnedByCoalition(entry, coalition, frontLine) {
  if (!entry || entry.id === 'auto') {
    return true;
  }

  const ownership = Array.isArray(entry.ownership) ? entry.ownership : [];
  if (ownership.length === 0) {
    return entry.coalition === coalition;
  }

  const normalizedFrontLine = normalizeFrontLineValue(frontLine);
  return ownership.some(
    (window) =>
      window.coalition === coalition &&
      normalizedFrontLine >= Number(window.minFrontLine) &&
      normalizedFrontLine <= Number(window.maxFrontLine)
  );
}

function findCuratedAirfieldByGroupPath(groupPath) {
  return getStartingAirfields().find((entry) => entry.groupPath === groupPath) || null;
}

function chooseMissionFamily(targetType, seed) {
  const families = missionTargetFamilies[targetType] || missionTargetFamilies['Ground Attack'];
  return pickOne(families, seed + 19) || missionTargetFamilies['Ground Attack'][0];
}

function chooseLandscapeLocation(family, enemyFaction, seed, context = {}) {
  if (!family?.source) {
    return null;
  }

  const frontLine = normalizeFrontLineValue(context.frontLine);
  const availableFriendlyAirfields = Array.isArray(context.availableFriendlyAirfields)
    ? context.availableFriendlyAirfields.filter((entry) => entry?.position)
    : [];

  if (family.source.kind === 'group') {
    const seenPaths = new Set();
    const groups = readLandscapeGroups().filter(
      (entry) =>
        family.source.categories.includes(entry.category) &&
        isUsefulLandscapeGroup(entry) &&
        matchesFactionPreference(entry, enemyFaction)
    ).filter((entry) => {
      if (entry.category !== 'airfield_zone') {
        return true;
      }

      return String(entry.group_path || '').startsWith('AIRFIELDS >');
    }).filter((entry) => {
      const key = `${entry.category}|${entry.group_path || entry.group_name}`;
      if (seenPaths.has(key)) {
        return false;
      }
      seenPaths.add(key);
      return true;
    }).filter((entry) => {
      if (entry.category !== 'airfield_zone') {
        return true;
      }

      const curated = findCuratedAirfieldByGroupPath(entry.group_path);
      if (!curated) {
        return true;
      }

      return isAirfieldOwnedByCoalition(curated, enemyFaction, frontLine);
    });

    const sortedGroups = [...groups].sort((left, right) => {
      const leftDistance = availableFriendlyAirfields.length
        ? Math.min(
            ...availableFriendlyAirfields.map((airfield) =>
              getDistance2d(airfield.position, { x: left.center_x, z: left.center_z })
            )
          )
        : 0;
      const rightDistance = availableFriendlyAirfields.length
        ? Math.min(
            ...availableFriendlyAirfields.map((airfield) =>
              getDistance2d(airfield.position, { x: right.center_x, z: right.center_z })
            )
          )
        : 0;
      const maxDistance = context.role === 'attack' ? 150000 : 240000;
      const leftPenalty = leftDistance > maxDistance ? 1 : 0;
      const rightPenalty = rightDistance > maxDistance ? 1 : 0;

      if (leftPenalty !== rightPenalty) {
        return leftPenalty - rightPenalty;
      }

      return leftDistance - rightDistance;
    });

    const topChoices = sortedGroups.slice(0, Math.min(sortedGroups.length, context.role === 'attack' ? 6 : 10));
    const choice = pickOne(topChoices, seed + 101) || sortedGroups[0];
    if (!choice) {
      return null;
    }

    return {
      kind: 'group',
      label: deriveLocationLabel(choice, choice.category),
      category: choice.category,
      x: choice.center_x,
      y: choice.center_y,
      z: choice.center_z,
      sourceFile: choice.source_file,
      groupPath: choice.group_path,
      raw: choice,
    };
  }

  if (family.source.kind === 'object') {
    const objects = readLandscapeObjects().filter(
      (entry) =>
        family.source.categories.includes(entry.category) &&
        matchesFactionPreference(entry, enemyFaction)
    );
    const choice = pickOne(objects, seed + 131);
    if (!choice) {
      return null;
    }

    return {
      kind: 'object',
      label: deriveLocationLabel(choice, choice.category),
      category: choice.category,
      x: choice.x,
      y: choice.y,
      z: choice.z,
      sourceFile: choice.source_file,
      groupPath: choice.group_path,
      raw: choice,
    };
  }

  return null;
}

function scoreTargetEntry(entry, family, location) {
  let score = 0;
  const searchBlob = normalizeText(
    `${entry.category} ${entry.display_name} ${entry.script_path} ${entry.model_path} ${entry.key}`
  );

  if (entry.category === 'bridge' && family.source?.categories?.includes('road_bridge')) {
    score += searchBlob.includes('rail') ? 0 : 5;
  }

  if (entry.category === 'bridge' && family.source?.categories?.includes('rail_bridge')) {
    score += searchBlob.includes('rail') || searchBlob.includes('rw_') ? 5 : 0;
  }

  (family.targetHints || []).forEach((hint) => {
    if (searchBlob.includes(normalizeText(hint))) {
      score += 4;
    }
  });

  if (location?.category === 'airfield_zone' && searchBlob.includes('airfield')) {
    score += 2;
  }
  if (location?.category === 'industrial_port_zone' && (searchBlob.includes('port_') || searchBlob.includes('shipyard'))) {
    score += 2;
  }
  if (location?.category === 'railway_station_zone' && (searchBlob.includes('rw_') || searchBlob.includes('rail'))) {
    score += 2;
  }
  if (location?.category === 'military_camp_zone' && (searchBlob.includes('tent') || searchBlob.includes('barrack'))) {
    score += 2;
  }

  return score;
}

function buildTargetPool(missionCatalog, input, enemyFaction) {
  return missionCatalog.filter((entry) => {
    if (!['static_target', 'bridge', 'fixed_weapon', 'ground_vehicle', 'naval'].includes(entry.category)) {
      return false;
    }

    if (!entry.model_path || !entry.script_path) {
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

function chooseTargets(targetPool, seed, family, location) {
  const sortedPool = [...targetPool].sort((left, right) => {
    const scoreDelta = scoreTargetEntry(right, family, location) - scoreTargetEntry(left, family, location);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return String(left.key || '').localeCompare(String(right.key || ''));
  });

  const chosenTargets = [];
  const maxTargets = Math.min(family?.targetCount || 3, sortedPool.length);
  for (let i = 0; i < maxTargets; i += 1) {
    const target = pickOne(sortedPool.slice(0, Math.min(sortedPool.length, 12)), seed + i * 17) || sortedPool[i];
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

function getAvailableStartingAirfields(aircraft, frontLine = getDefaultFrontLineState()) {
  const coalition = getAircraftCoalition(aircraft);
  return getStartingAirfields().filter(
    (entry) => entry.id === 'auto' || isAirfieldOwnedByCoalition(entry, coalition, frontLine)
  );
}

function getTemplateStartingAirfield(aircraft) {
  return getAircraftCoalition(aircraft) === 'UN/US-aligned'
    ? getStartingAirfields().find((entry) => entry.id === 'seoul')
    : getStartingAirfields().find((entry) => entry.id === 'antung');
}

function getSelectedStartingAirfield(aircraft, requestedAirfieldId, frontLine, targetLocation) {
  const available = getAvailableStartingAirfields(aircraft, frontLine).filter((entry) => entry.id !== 'auto');
  const fallback = getTemplateStartingAirfield(aircraft);
  if (!requestedAirfieldId || requestedAirfieldId === 'auto') {
    if (targetLocation) {
      const nearest = [...available].sort(
        (left, right) =>
          getDistance2d(left.position, targetLocation) - getDistance2d(right.position, targetLocation)
      )[0];
      return nearest || fallback;
    }

    return available[0] || fallback;
  }

  return available.find((entry) => entry.id === requestedAirfieldId) || fallback;
}

function chooseSupportAircraft(playerAircraft, role, seed, supportLevel = 'escort') {
  if (supportLevel === 'none') {
    return null;
  }

  const coalition = getAircraftCoalition(playerAircraft);
  const poolSet = supportAircraftPools[coalition];
  if (!poolSet) {
    return playerAircraft;
  }

  const poolKey = supportLevel === 'escort' || role === 'fighter' ? 'fighter' : 'strike';
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
  const installInfo = requireIl2Install();
  return fs.readFileSync(path.join(installInfo.missionTemplateRoot, `${baseName}.Mission`), 'utf8');
}

function readTemplateLocalizationText(baseName) {
  const installInfo = requireIl2Install();
  return fs.readFileSync(path.join(installInfo.missionTemplateRoot, `${baseName}.eng`), 'utf16le').replace(/^\uFEFF/, '');
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

function parseShipBlocks(missionText) {
  const shipPattern = /Ship\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(shipPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    linkTrId: extractMissionValue(block, 'LinkTrId') || '',
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    script: extractMissionValue(block, 'Script')?.replace(/^"|"$/g, '') || '',
    model: extractMissionValue(block, 'Model')?.replace(/^"|"$/g, '') || '',
    country: extractMissionValue(block, 'Country') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    y: Number(extractMissionValue(block, 'YPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
    yOri: Number(extractMissionValue(block, 'YOri')),
  }));
}

function parseAttackAreaBlocks(missionText) {
  const pattern = /MCU_CMD_AttackArea\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(pattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
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

function parseWaypointBlocks(missionText) {
  const waypointPattern = /MCU_Waypoint\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(waypointPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    targets: extractMissionValue(block, 'Targets') || '',
    objects: extractMissionValue(block, 'Objects') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    y: Number(extractMissionValue(block, 'YPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
    area: Number(extractMissionValue(block, 'Area')),
    speed: Number(extractMissionValue(block, 'Speed')),
    priority: extractMissionValue(block, 'Priority') || '',
  }));
}

function parseIconBlocks(missionText) {
  const iconPattern = /MCU_Icon\s*\{[\s\S]*?\n\s*\}/g;
  const blocks = missionText.match(iconPattern) || [];
  return blocks.map((block) => ({
    block,
    index: extractMissionValue(block, 'Index') || '',
    name: extractMissionValue(block, 'Name')?.replace(/^"|"$/g, '') || '',
    targets: extractMissionValue(block, 'Targets') || '',
    x: Number(extractMissionValue(block, 'XPos')),
    y: Number(extractMissionValue(block, 'YPos')),
    z: Number(extractMissionValue(block, 'ZPos')),
    iconId: extractMissionValue(block, 'IconId') || '',
    lineType: extractMissionValue(block, 'LineType') || '',
    coalitions: extractMissionValue(block, 'Coalitions') || '',
  }));
}

function getDistance2d(a, b) {
  const dx = Number(a.x) - Number(b.x);
  const dz = Number(a.z) - Number(b.z);
  return Math.sqrt(dx * dx + dz * dz);
}

function replaceMissionCoordinate(block, key, value) {
  return block.replace(new RegExp(`(\\n\\s*${key}\\s*=\\s*)[^;]+;`), `$1${formatNumber(value)};`);
}

function shiftMissionBlockPosition(block, dx, dz) {
  const x = Number(extractMissionValue(block, 'XPos'));
  const z = Number(extractMissionValue(block, 'ZPos'));
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return block;
  }

  let updated = replaceMissionCoordinate(block, 'XPos', x + dx);
  updated = replaceMissionCoordinate(updated, 'ZPos', z + dz);
  return updated;
}

function buildStaticTargetBlockFromShipBlock(shipBlock, target, enemyCountry) {
  const index = extractMissionValue(shipBlock, 'Index') || '0';
  const linkTrId = extractMissionValue(shipBlock, 'LinkTrId') || '0';
  const xPos = Number(extractMissionValue(shipBlock, 'XPos')) || 0;
  const yPos = Number(extractMissionValue(shipBlock, 'YPos')) || 0;
  const zPos = Number(extractMissionValue(shipBlock, 'ZPos')) || 0;
  const yOri = Number(extractMissionValue(shipBlock, 'YOri')) || 0;
  const safeCountry = Number.isFinite(Number(enemyCountry)) ? Number(enemyCountry) : 0;

  return `Block
  {
    Name = "Block";
    Index = ${index};
    LinkTrId = ${linkTrId};
    XPos = ${formatNumber(xPos)};
    YPos = ${formatNumber(yPos)};
    ZPos = ${formatNumber(zPos)};
    XOri = 0;
    YOri = ${formatNumber(yOri)};
    ZOri = 0;
    Model = "${target.modelPath}";
    Script = "${target.scriptPath}";
    Country = ${safeCountry};
    Desc = "";
    DamageReport = 50;
    DamageThreshold = 1;
    DeleteAfterDeath = 1;
    PinToTerrain = 1;
    Flags = 0;
  }`;
}

function replaceExactBlockOnce(text, originalBlock, replacementBlock) {
  return text.replace(originalBlock, replacementBlock);
}

function retargetTemplateObjectivePackage(missionText, scenario) {
  const targetArea = scenario.environment?.targetArea;
  if (!targetArea || !Number.isFinite(targetArea.x) || !Number.isFinite(targetArea.z)) {
    return missionText;
  }

  const attackAreas = parseAttackAreaBlocks(missionText);
  const sourceAttackArea = attackAreas[0];
  if (!sourceAttackArea) {
    return missionText;
  }

  const dx = targetArea.x - sourceAttackArea.x;
  const dz = targetArea.z - sourceAttackArea.z;
  const sourceCenter = { x: sourceAttackArea.x, z: sourceAttackArea.z };
  const shiftRadius = 12000;
  const convertShipsToStatics =
    getTemplateDefinition(scenario.aircraft.player).baseName === '[DEMO]InchonStrike' &&
    scenario.filters.targetType !== 'Harbor Strike';
  const chosenTargets = scenario.targets || [];
  let updatedMissionText = missionText;
  let convertedShipCount = 0;

  const processBlocks = (pattern, transform) => {
    const blocks = updatedMissionText.match(pattern) || [];
    blocks.forEach((block) => {
      const x = Number(extractMissionValue(block, 'XPos'));
      const z = Number(extractMissionValue(block, 'ZPos'));
      if (!Number.isFinite(x) || !Number.isFinite(z)) {
        return;
      }

      if (getDistance2d({ x, z }, sourceCenter) > shiftRadius) {
        return;
      }

      const nextBlock = transform(block);
      updatedMissionText = replaceExactBlockOnce(updatedMissionText, block, nextBlock);
    });
  };

  processBlocks(/Ship\s*\{[\s\S]*?\n\s*\}/g, (block) => {
    let shifted = shiftMissionBlockPosition(block, dx, dz);
    if (convertShipsToStatics && chosenTargets.length > 0) {
      const target = chosenTargets[convertedShipCount % chosenTargets.length];
      convertedShipCount += 1;
      shifted = buildStaticTargetBlockFromShipBlock(shifted, target, getEnemyCountry(scenario.aircraft.player));
    }
    return shifted;
  });

  [
    /Block\s*\{[\s\S]*?\n\s*\}/g,
    /Vehicle\s*\{[\s\S]*?\n\s*\}/g,
    /Bridge\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_TR_Entity\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Waypoint\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Timer\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Activate\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Deactivate\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_CMD_AttackArea\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_CheckZone\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Icon\s*\{[\s\S]*?\n\s*\}/g,
    /MCU_Command_AttackArea\s*\{[\s\S]*?\n\s*\}/g,
  ].forEach((pattern) => {
    processBlocks(pattern, (block) => shiftMissionBlockPosition(block, dx, dz));
  });

  return updatedMissionText;
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
  if (!supportAircraft) {
    return missionText;
  }

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
  let updated = stripObjectRefsFromBlockTypes(missionText, playerEntityIds, ['MCU_CMD_Reposition', 'MCU_CMD_AttackArea']);

  const repositionCommandIds = collectBlockIndicesByPredicate(updated, 'MCU_CMD_Reposition', () => true);
  const repositionDialogIds = collectBlockIndicesByPredicate(
    updated,
    'MCU_TR_Media',
    (block) => /Config\s*=\s*"nsdata\\dialogs\\reposition-from-target\.json";/i.test(block)
  );

  const idsToDisconnect = new Set([...repositionCommandIds, ...repositionDialogIds]);
  updated = stripIdsFromMissionLists(updated, idsToDisconnect);

  return updated;
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

function getMissionMaxIndex(missionText) {
  const matches = [...missionText.matchAll(/\bIndex\s*=\s*(\d+);/g)].map((match) => Number(match[1]));
  return matches.length ? Math.max(...matches) : 3;
}

function stripIdsFromMissionLists(missionText, idsToRemove) {
  if (!idsToRemove || idsToRemove.size === 0) {
    return missionText;
  }

  return missionText
    .replace(/Targets\s*=\s*\[([^\]]*)\];/g, (match, contents) => `Targets = ${removeObjectIdsFromList(contents, idsToRemove)};`)
    .replace(/Objects\s*=\s*\[([^\]]*)\];/g, (match, contents) => `Objects = ${removeObjectIdsFromList(contents, idsToRemove)};`);
}

function stripBlockTypesByIndexSet(missionText, blockType, idsToRemove) {
  if (!idsToRemove || idsToRemove.size === 0) {
    return missionText;
  }

  const pattern = new RegExp(`${blockType}\\s*\\{[\\s\\S]*?\\n\\s*\\}`, 'g');
  return missionText.replace(pattern, (block) => {
    const index = extractMissionValue(block, 'Index');
    return idsToRemove.has(index) ? '' : block;
  });
}

function stripTemplateBriefingIcons(missionText) {
  const iconIdsToRemove = new Set(
    parseIconBlocks(missionText)
      .filter((entry) => {
        const isRouteIcon = ['901', '902', '903'].includes(entry.iconId) && entry.lineType === '15';
        const isFrontLineOverlay = entry.lineType === '13';
        return !(isRouteIcon || isFrontLineOverlay);
      })
      .map((entry) => entry.index)
      .filter(Boolean)
  );

  if (iconIdsToRemove.size === 0) {
    return missionText;
  }

  let updated = stripIdsFromMissionLists(missionText, iconIdsToRemove);
  updated = stripBlockTypesByIndexSet(updated, 'MCU_Icon', iconIdsToRemove);
  return updated;
}

function collectBlockIndicesByPredicate(missionText, blockType, predicate) {
  const pattern = new RegExp(`${blockType}\\s*\\{[\\s\\S]*?\\n\\s*\\}`, 'g');
  const matches = missionText.match(pattern) || [];
  return new Set(
    matches
      .filter((block) => predicate(block))
      .map((block) => extractMissionValue(block, 'Index'))
      .filter(Boolean)
  );
}

function appendBlocksToMissionRoot(missionText, blockTexts) {
  if (!blockTexts.length) {
    return missionText;
  }

  const insertion = `${blockTexts.join('\r\n\r\n')}\r\n`;
  return missionText.replace(/\r?\n\}\s*$/, `\r\n\r\n${insertion}}`);
}

function replaceMissionField(block, key, value) {
  return block.replace(new RegExp(`(\\n\\s*${key}\\s*=\\s*)[^;]+;`), `$1${value};`);
}

function isJetAircraft(aircraft) {
  return new Set(['f80c10', 'f84e', 'f86a5', 'mig15bis', 'b29']).has(String(aircraft || '').toLowerCase());
}

function rebuildEnvelopePlayerRoute(missionText, scenario, startAirfield) {
  const targetArea = scenario.environment?.targetArea;
  const startPosition = startAirfield?.position;
  if (!targetArea || !startPosition) {
    return missionText;
  }

  const playerEntityIds = new Set(getPlayerFlightEntityIds(missionText));
  const playerWaypoints = parseWaypointBlocks(missionText).filter((entry) => {
    const objectIds = entry.objects
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return objectIds.some((item) => playerEntityIds.has(item));
  });

  if (playerWaypoints.length === 0) {
    return missionText;
  }

  const vectorX = Number(targetArea.x) - Number(startPosition.x);
  const vectorZ = Number(targetArea.z) - Number(startPosition.z);
  const length = Math.hypot(vectorX, vectorZ) || 1;
  const dirX = vectorX / length;
  const dirZ = vectorZ / length;
  const sideX = -dirZ;
  const sideZ = dirX;
  const jetProfile = isJetAircraft(scenario.aircraft?.player);
  const routeProfileByType = {
    'Airfield Strike': {
      ingressDistance: jetProfile ? 18000 : 12000,
      stagingDistance: jetProfile ? 26000 : 16000,
      attackDistance: jetProfile ? 8000 : 5000,
      egressDistance: jetProfile ? 14000 : 9000,
      ingressAltitude: jetProfile ? 2200 : 1500,
      stagingAltitude: jetProfile ? 3600 : 2000,
      attackAltitude: jetProfile ? 2400 : 1300,
      egressAltitude: jetProfile ? 2200 : 1600,
      ingressSpeed: jetProfile ? 620 : 380,
      stagingSpeed: jetProfile ? 720 : 420,
      attackSpeed: jetProfile ? 640 : 360,
      egressSpeed: jetProfile ? 700 : 400,
    },
    'Bridge Strike': {
      ingressDistance: 14000,
      stagingDistance: 20000,
      attackDistance: 6500,
      egressDistance: 10000,
      ingressAltitude: 1600,
      stagingAltitude: 2400,
      attackAltitude: 1300,
      egressAltitude: 1800,
      ingressSpeed: 520,
      stagingSpeed: 560,
      attackSpeed: 500,
      egressSpeed: 540,
    },
    'Ground Attack': {
      ingressDistance: 12000,
      stagingDistance: 18000,
      attackDistance: 5500,
      egressDistance: 9000,
      ingressAltitude: 1400,
      stagingAltitude: 2200,
      attackAltitude: 1200,
      egressAltitude: 1600,
      ingressSpeed: 500,
      stagingSpeed: 540,
      attackSpeed: 480,
      egressSpeed: 520,
    },
    'Harbor Strike': {
      ingressDistance: 22000,
      stagingDistance: 30000,
      attackDistance: 9000,
      egressDistance: 16000,
      ingressAltitude: 2600,
      stagingAltitude: 3800,
      attackAltitude: 2200,
      egressAltitude: 2600,
      ingressSpeed: 650,
      stagingSpeed: 760,
      attackSpeed: 620,
      egressSpeed: 700,
    },
    'Industrial Strike': {
      ingressDistance: 18000,
      stagingDistance: 24000,
      attackDistance: 7000,
      egressDistance: 13000,
      ingressAltitude: 2400,
      stagingAltitude: 3400,
      attackAltitude: 2100,
      egressAltitude: 2400,
      ingressSpeed: 610,
      stagingSpeed: 700,
      attackSpeed: 590,
      egressSpeed: 660,
    },
    'Rail Interdiction': {
      ingressDistance: 16000,
      stagingDistance: 22000,
      attackDistance: 6500,
      egressDistance: 11000,
      ingressAltitude: 1800,
      stagingAltitude: 2600,
      attackAltitude: 1400,
      egressAltitude: 1900,
      ingressSpeed: 560,
      stagingSpeed: 610,
      attackSpeed: 520,
      egressSpeed: 580,
    },
    'Troop Area Strike': {
      ingressDistance: 14000,
      stagingDistance: 20000,
      attackDistance: 6000,
      egressDistance: 10000,
      ingressAltitude: 1600,
      stagingAltitude: 2400,
      attackAltitude: 1300,
      egressAltitude: 1700,
      ingressSpeed: 520,
      stagingSpeed: 570,
      attackSpeed: 490,
      egressSpeed: 540,
    },
  };
  const routeProfile = routeProfileByType[scenario.filters.targetType] || routeProfileByType['Ground Attack'];

  const routePoints = [
    {
      x: Number(startPosition.x) + dirX * routeProfile.ingressDistance + sideX * 3000,
      z: Number(startPosition.z) + dirZ * routeProfile.ingressDistance + sideZ * 3000,
      y: routeProfile.ingressAltitude,
      speed: routeProfile.ingressSpeed,
      area: 1200,
    },
    {
      x: Number(targetArea.x) - dirX * routeProfile.stagingDistance + sideX * 9000,
      z: Number(targetArea.z) - dirZ * routeProfile.stagingDistance + sideZ * 9000,
      y: routeProfile.stagingAltitude,
      speed: routeProfile.stagingSpeed,
      area: 1800,
    },
    {
      x: Number(targetArea.x) - dirX * routeProfile.attackDistance + sideX * 2200,
      z: Number(targetArea.z) - dirZ * routeProfile.attackDistance + sideZ * 2200,
      y: routeProfile.attackAltitude,
      speed: routeProfile.attackSpeed,
      area: 1400,
    },
    {
      x: Number(targetArea.x) + dirX * routeProfile.egressDistance - sideX * 7000,
      z: Number(targetArea.z) + dirZ * routeProfile.egressDistance - sideZ * 7000,
      y: routeProfile.egressAltitude,
      speed: routeProfile.egressSpeed,
      area: 1800,
    },
  ];

  const landingWaypoint = playerWaypoints.find((entry) => /land/i.test(entry.name));
  const routeWaypoints = playerWaypoints
    .filter((entry) => entry !== landingWaypoint)
    .filter((entry) => Number.isFinite(entry.y) && entry.y >= 1000)
    .sort((left, right) => left.index.localeCompare(right.index, undefined, { numeric: true }));

  let orderedRouteWaypoints = routeWaypoints;
  if (routeWaypoints.length >= 3) {
    const startWaypoint = [...routeWaypoints].sort(
      (left, right) =>
        getDistance2d(left, { x: Number(startPosition.x), z: Number(startPosition.z) }) -
        getDistance2d(right, { x: Number(startPosition.x), z: Number(startPosition.z) })
    )[0];

    const attackWaypoint = [...routeWaypoints]
      .filter((entry) => entry !== startWaypoint)
      .sort(
        (left, right) =>
          getDistance2d(left, { x: Number(targetArea.x), z: Number(targetArea.z) }) -
          getDistance2d(right, { x: Number(targetArea.x), z: Number(targetArea.z) })
      )[0];

    const ingressWaypoint = routeWaypoints.find((entry) => entry !== startWaypoint && entry !== attackWaypoint) || attackWaypoint;
    orderedRouteWaypoints = [startWaypoint, ingressWaypoint, attackWaypoint].filter(Boolean);
  }

  let updated = missionText;

  orderedRouteWaypoints.forEach((entry, index) => {
    const point = routePoints[Math.min(index, routePoints.length - 2)];
    let nextBlock = entry.block;
    nextBlock = replaceMissionCoordinate(nextBlock, 'XPos', point.x);
    nextBlock = replaceMissionCoordinate(nextBlock, 'YPos', point.y);
    nextBlock = replaceMissionCoordinate(nextBlock, 'ZPos', point.z);
    nextBlock = replaceMissionField(nextBlock, 'Area', point.area);
    nextBlock = replaceMissionField(nextBlock, 'Speed', point.speed);
    updated = replaceExactBlockOnce(updated, entry.block, nextBlock);
  });

  if (landingWaypoint) {
    let nextBlock = landingWaypoint.block;
    nextBlock = replaceMissionCoordinate(nextBlock, 'XPos', Number(startPosition.x) + dirX * 3500);
    nextBlock = replaceMissionCoordinate(nextBlock, 'YPos', 1000);
    nextBlock = replaceMissionCoordinate(nextBlock, 'ZPos', Number(startPosition.z) + dirZ * 3500);
    nextBlock = replaceMissionField(nextBlock, 'Area', 5000);
    nextBlock = replaceMissionField(nextBlock, 'Speed', 450);
    updated = replaceExactBlockOnce(updated, landingWaypoint.block, nextBlock);
  }

  return updated;
}

function rebuildTemplatePlayerRoute(missionText, scenario, startAirfield) {
  return rebuildEnvelopePlayerRoute(missionText, scenario, startAirfield);
}

function rebuildTemplateBriefingIcons(missionText, scenario, startAirfield) {
  const targetArea = scenario.environment?.targetArea;
  const startPosition = startAirfield?.position;
  if (!targetArea || !startPosition) {
    return missionText;
  }

  const routeIcons = parseIconBlocks(missionText)
    .filter((entry) => ['901', '902', '903'].includes(entry.iconId) && entry.lineType === '15')
    .sort((left, right) => Number(left.index) - Number(right.index));

  if (routeIcons.length < 3) {
    return missionText;
  }

  const vectorX = Number(targetArea.x) - Number(startPosition.x);
  const vectorZ = Number(targetArea.z) - Number(startPosition.z);
  const length = Math.hypot(vectorX, vectorZ) || 1;
  const dirX = vectorX / length;
  const dirZ = vectorZ / length;

  const pointStart = {
    x: Number(startPosition.x),
    y: 20,
    z: Number(startPosition.z),
  };
  const pointIngress = {
    x: Number(startPosition.x) + dirX * Math.min(length * 0.35, 14000),
    y: 400,
    z: Number(startPosition.z) + dirZ * Math.min(length * 0.35, 14000),
  };
  const pointTarget = {
    x: Number(targetArea.x),
    y: Math.max(20, Number(targetArea.y) || 20),
    z: Number(targetArea.z),
  };
  const pointEgress = {
    x: Number(targetArea.x) - dirX * Math.min(length * 0.2, 8000),
    y: 350,
    z: Number(targetArea.z) - dirZ * Math.min(length * 0.2, 8000),
  };
  const pointReturn = {
    x: Number(startPosition.x) + dirX * Math.min(length * 0.15, 7000),
    y: 300,
    z: Number(startPosition.z) + dirZ * Math.min(length * 0.15, 7000),
  };

  let updated = missionText;
  routeIcons.forEach((entry) => {
    let point = pointIngress;
    if (entry.iconId === '903') {
      point = pointStart;
    } else if (entry.iconId === '902') {
      point = pointTarget;
    } else if (entry.iconId === '901') {
      const nearTarget = getDistance2d(entry, targetArea) <= getDistance2d(entry, startPosition);
      point = nearTarget ? pointEgress : pointReturn;
    }

    let nextBlock = entry.block;
    nextBlock = replaceMissionCoordinate(nextBlock, 'XPos', point.x);
    nextBlock = replaceMissionCoordinate(nextBlock, 'YPos', point.y);
    nextBlock = replaceMissionCoordinate(nextBlock, 'ZPos', point.z);
    updated = replaceExactBlockOnce(updated, entry.block, nextBlock);
  });

  return updated;
}

function buildTemplateEnvelopeTargetBlocks(scenario, startIndex, enemyCountry) {
  const targetArea = scenario.environment?.targetArea;
  if (!targetArea) {
    return [];
  }

  const placementByType = {
    'Airfield Strike': [
      { x: -320, z: -180, yOri: 0 },
      { x: 0, z: 40, yOri: 24 },
      { x: 320, z: 180, yOri: 0 },
      { x: -120, z: 240, yOri: 70 },
    ],
    'Bridge Strike': [
      { x: -180, z: 0, yOri: 90 },
      { x: 0, z: 0, yOri: 90 },
      { x: 180, z: 0, yOri: 90 },
    ],
    'Ground Attack': [
      { x: -260, z: -120, yOri: 10 },
      { x: 40, z: 30, yOri: 35 },
      { x: 280, z: 170, yOri: 60 },
      { x: -120, z: 210, yOri: 120 },
    ],
    'Harbor Strike': [
      { x: -420, z: -260, yOri: 315 },
      { x: -120, z: -80, yOri: 300 },
      { x: 180, z: 60, yOri: 290 },
      { x: 420, z: 240, yOri: 280 },
    ],
    'Industrial Strike': [
      { x: -300, z: -160, yOri: 0 },
      { x: -60, z: 20, yOri: 24 },
      { x: 220, z: 140, yOri: 40 },
      { x: 420, z: -40, yOri: 10 },
    ],
    'Rail Interdiction': [
      { x: -260, z: -40, yOri: 45 },
      { x: -80, z: 0, yOri: 45 },
      { x: 120, z: 40, yOri: 45 },
      { x: 320, z: 80, yOri: 45 },
    ],
    'Troop Area Strike': [
      { x: -280, z: -180, yOri: 0 },
      { x: -40, z: -20, yOri: 18 },
      { x: 220, z: 120, yOri: 36 },
      { x: 40, z: 240, yOri: 54 },
    ],
  };

  const placements = placementByType[scenario.filters.targetType] || [
    { x: -220, z: -140, yOri: 0 },
    { x: 0, z: 30, yOri: 20 },
    { x: 240, z: 160, yOri: 45 },
  ];

  return (scenario.targets || []).map((target, index) => {
    const placement = placements[index % placements.length];
    const objectType = String(target.objectType || 'Block');
    const safeScriptPath =
      target.scriptPath ||
      (typeof target.key === 'string' && target.key.split('|').length >= 3 ? target.key.split('|')[1] : '');
    const safeModelPath =
      target.modelPath ||
      (typeof target.key === 'string' && target.key.split('|').length >= 3 ? target.key.split('|')[2] : '');

    return `${objectType}
  {
    Name = "${objectType}";
    Index = ${startIndex + index};
    LinkTrId = 0;
    XPos = ${formatNumber(Number(targetArea.x) + placement.x)};
    YPos = ${formatNumber(Number(targetArea.y) || 0)};
    ZPos = ${formatNumber(Number(targetArea.z) + placement.z)};
    XOri = 0;
    YOri = ${formatNumber(placement.yOri)};
    ZOri = 0;
    Model = "${safeModelPath}";
    Script = "${safeScriptPath}";
    Country = ${enemyCountry};
    Desc = "";
    DamageReport = 50;
    DamageThreshold = 1;
    DeleteAfterDeath = 1;
    PinToTerrain = 1;
    Flags = 0;
  }`;
  });
}

function stripTemplateObjectivePackage(missionText, scenario) {
  const attackAreas = parseAttackAreaBlocks(missionText);
  const sourceAttackArea = attackAreas[0];
  if (!sourceAttackArea) {
    return missionText;
  }

  const sourceCenter = { x: sourceAttackArea.x, z: sourceAttackArea.z };
  const objectiveRadius = 9000;

  const blockIds = new Set(
    parseBlockObjects(missionText)
      .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.z) && getDistance2d(entry, sourceCenter) <= objectiveRadius)
      .map((entry) => entry.index)
  );

  const shipIds = new Set(
    parseShipBlocks(missionText)
      .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.z) && getDistance2d(entry, sourceCenter) <= objectiveRadius)
      .map((entry) => entry.index)
  );

  const vehicleIds = new Set(
    parseVehicleBlocks(missionText)
      .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.z) && getDistance2d(entry, sourceCenter) <= objectiveRadius)
      .map((entry) => entry.index)
  );

  const bridgeIds = new Set(
    (missionText.match(/Bridge\s*\{[\s\S]*?\n\s*\}/g) || [])
      .map((block) => ({
        block,
        index: extractMissionValue(block, 'Index') || '',
        x: Number(extractMissionValue(block, 'XPos')),
        z: Number(extractMissionValue(block, 'ZPos')),
      }))
      .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.z) && getDistance2d(entry, sourceCenter) <= objectiveRadius)
      .map((entry) => entry.index)
  );

  const allObjectIds = new Set([...blockIds, ...shipIds, ...vehicleIds, ...bridgeIds]);
  const linkedEntityIds = new Set(
    parseEntityBlocks(missionText)
      .filter((entry) => allObjectIds.has(entry.misObjId))
      .map((entry) => entry.index)
  );

  let updated = missionText;
  updated = stripIdsFromMissionLists(updated, new Set([...allObjectIds, ...linkedEntityIds]));
  updated = stripBlockTypesByIndexSet(updated, 'Block', blockIds);
  updated = stripBlockTypesByIndexSet(updated, 'Ship', shipIds);
  updated = stripBlockTypesByIndexSet(updated, 'Vehicle', vehicleIds);
  updated = stripBlockTypesByIndexSet(updated, 'Bridge', bridgeIds);
  updated = stripBlockTypesByIndexSet(updated, 'MCU_TR_Entity', linkedEntityIds);

  const nextIndex = getMissionMaxIndex(updated) + 1;
  const enemyCountry = getEnemyCountry(scenario.aircraft.player);
  const targetBlocks = buildTemplateEnvelopeTargetBlocks(scenario, nextIndex, enemyCountry);
  updated = appendBlocksToMissionRoot(updated, targetBlocks);

  return updated;
}

function buildMissionTextFromTemplateEnvelope({ scenario, landscape, supportAircraft, startAirfield }) {
  let missionText = buildMissionTextFromTemplate({ scenario, landscape, supportAircraft, startAirfield });
  missionText = stripTemplateObjectivePackage(missionText, scenario);
  missionText = rebuildEnvelopePlayerRoute(missionText, scenario, startAirfield);
  return missionText;
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
  missionText = stripTemplateBriefingIcons(missionText);
  missionText = applyAmbientVariation(missionText, scenario, supportAircraft, makeSeed(scenario.filters));
  missionText = shiftAmbientPackage(missionText, scenario.aircraft.player, startAirfield);
  missionText = shiftPlayerStartPackage(missionText, scenario.aircraft.player, startAirfield);
  missionText = retargetTemplateObjectivePackage(missionText, scenario);
  missionText = rebuildTemplatePlayerRoute(missionText, scenario, startAirfield);
  missionText = rebuildTemplateBriefingIcons(missionText, scenario, startAirfield);
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

function formatSupportSummary(scenario) {
  if (!scenario.supportAircraft) {
    return 'No dedicated escort is assigned.';
  }

  const posture = scenario.missionFamily?.supportLevel || 'escort';
  if (posture === 'light') {
    return `Light cover by ${scenario.supportAircraft.toUpperCase()}.`;
  }

  return `Escort cover by ${scenario.supportAircraft.toUpperCase()}.`;
}

function formatDefenseSummary(scenario) {
  const density = scenario.missionFamily?.defenseDensity || 'medium';
  return `${density[0].toUpperCase()}${density.slice(1)} expected resistance.`;
}

function buildObjectiveText(scenario, area, chosenTargets) {
  const profile = getMissionTypeProfile(scenario.filters.targetType);
  return `${scenario.aircraft.player.toUpperCase()} mission. ${profile.objectiveText}`;
}

function buildLocalizationTextFromTemplate(scenario, area, chosenTargets) {
  const template = getTemplateDefinition(scenario.aircraft.player);
  const profile = getMissionTypeProfile(scenario.filters.targetType);
  const familyCommandText = scenario.missionFamily?.commandText || profile.commandText;
  const familyIngressText = scenario.missionFamily?.ingressText || profile.ingressText;
  const lines = readTemplateLocalizationText(template.baseName).replace(/\r\n/g, '\n').split('\n');
  const briefing = buildObjectiveText(scenario, area, chosenTargets);
  const missionComplete = `${scenario.filters.targetType} completed.`;
  const enemyActivity = `${familyIngressText} Enemy ${scenario.filters.enemyFaction} opposition expected in the target area. ${formatDefenseSummary(scenario)}`;
  const departureAirfield = scenario.startAirfield?.label || 'base';
  const recovery = `${profile.recoveryText} Recover at ${departureAirfield}.`;
  const targetLocation = scenario.targetLocation?.label ? ` Target area: ${scenario.targetLocation.label}.` : '';

  setLocalizationLine(lines, 0, `Scenario - ${scenario.title}`);
  setLocalizationLine(lines, 1, briefing);
  setLocalizationLine(lines, 2, 'Codex');

  [
    226, 228, 230, 232, 234, 236, 238, 240, 242, 244, 246, 248, 252, 254, 256, 258, 263, 267,
  ].forEach((index) => {
    setLocalizationLine(lines, index, profile.iconText);
  });

  setLocalizationLine(lines, 210, `Take off from ${departureAirfield}. ${familyCommandText}${targetLocation}`);
  setLocalizationLine(lines, 211, familyIngressText);
  setLocalizationLine(lines, 212, `${familyCommandText}${targetLocation}`);
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

function shouldUseScratchBuilder(scenario) {
  return false;
}

function shouldUseTemplateEnvelopeBuilder(scenario) {
  const flag = String(process.env.IL2_KOREA_TEMPLATE_ENVELOPE || '').trim().toLowerCase();
  if (!(flag === '1' || flag === 'true' || flag === 'yes' || flag === 'on')) {
    return false;
  }

  return scratchBuilderMissionTypes.has(scenario.filters.targetType);
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
  const installInfo = requireIl2Install();
  if (!fs.existsSync(installInfo.nsDataUserRoot)) {
    return [];
  }

  return fs
    .readdirSync(installInfo.nsDataUserRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(installInfo.nsDataUserRoot, entry.name, 'LocalServerSetup.json'))
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
  const installInfo = exportToGame ? requireIl2Install() : detectIl2Install();
  const catalog = readCatalog();
  const seed = makeSeed(input);
  const missionCatalog = catalog.mission_object_catalog || [];
  const landscapes = catalog.landscape_templates || [];
  const friendlyFaction = getAircraftCoalition(input.aircraft);
  const enemyFaction = getOpposingCoalition(input.aircraft) || input.enemyFaction || null;
  const frontLine = normalizeFrontLineValue(input.frontLine);

  const landscape = landscapes.find((item) => item.landscape === input.landscape) || null;
  if (!landscape) {
    throw new Error(`Unknown landscape: ${input.landscape}`);
  }

  const missionFamily = chooseMissionFamily(input.targetType, seed);
  const role = input.targetType.includes('Strike') || input.targetType.includes('Attack') ? 'attack' : 'fighter';
  const availableFriendlyAirfields = getAvailableStartingAirfields(input.aircraft, frontLine).filter((entry) => entry.id !== 'auto');
  const targetLocation = chooseLandscapeLocation(missionFamily, enemyFaction, seed, {
    frontLine,
    playerAircraft: input.aircraft,
    role,
    availableFriendlyAirfields,
  });
  const targetPool = buildTargetPool(missionCatalog, input, enemyFaction);
  if (targetPool.length === 0) {
    throw new Error(
      `No valid ${input.targetType} targets found for ${input.aircraft.toUpperCase()} against ${enemyFaction || 'the selected enemy faction'}.`
    );
  }

  const chosenTargets = chooseTargets(targetPool, seed, missionFamily, targetLocation);
  const area = getMissionArea(input.targetType);
  const profile = getMissionTypeProfile(input.targetType);
  const supportAircraft = chooseSupportAircraft(input.aircraft, role, seed, missionFamily?.supportLevel);
  const startAirfield = getSelectedStartingAirfield(input.aircraft, input.startAirfield, frontLine, targetLocation);
  const startTime = input.startTime || '09:00:0';
  const coopFriendly = normalizeBoolean(input.coopFriendly);
  const effectiveTargetArea =
    targetLocation && Number.isFinite(targetLocation.x) && Number.isFinite(targetLocation.z)
      ? {
          x: Number(targetLocation.x),
          y: Number(targetLocation.y) || area.anchor.y,
          z: Number(targetLocation.z),
        }
      : area.anchor;

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
      frontLine,
      frontLineLabel: describeFrontLineState(frontLine),
      targetArea: effectiveTargetArea,
    },
    aircraft: {
      player: input.aircraft,
      faction: friendlyFaction,
      role,
    },
    missionFamily: missionFamily
      ? {
          id: missionFamily.id,
          label: missionFamily.label,
          supportLevel: missionFamily.supportLevel,
          defenseDensity: missionFamily.defenseDensity,
        }
      : null,
    targetLocation: targetLocation
      ? {
          kind: targetLocation.kind,
          label: targetLocation.label,
          category: targetLocation.category,
          x: Number(targetLocation.x),
          y: Number(targetLocation.y) || 0,
          z: Number(targetLocation.z),
          sourceFile: targetLocation.sourceFile,
          groupPath: targetLocation.groupPath,
        }
      : null,
    supportAircraft,
    startAirfield,
    coopFriendly,
    missionProfile: profile,
    targets: chosenTargets.map((entry) => ({
      key: entry.key,
      objectType: entry.object_type,
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
      missionFamily ? `Mission family selected: ${missionFamily.label}.` : null,
      targetLocation ? `Named target location selected: ${targetLocation.label}.` : null,
      supportAircraft ? `Friendly support flights retargeted to ${supportAircraft.toUpperCase()}.` : 'No dedicated escort assigned.',
      `Starting airfield: ${startAirfield.label}.`,
      `Front line setting: ${frontLine} (${describeFrontLineState(frontLine)}).`,
      `Start time: ${startTime}.`,
      installInfo.detected ? `Detected IL-2 install: ${installInfo.installRoot}.` : 'IL-2 install not detected.',
      coopFriendly ? 'COOP-friendly player flight enabled.' : 'Single-seat player flight export.',
      'Template mission builder requested from UI.',
    ].filter(Boolean),
  };

  const weather = weatherPresets[scenario.environment.weather] || weatherPresets.Clear;
  const useScratchBuilder = shouldUseScratchBuilder(scenario);
  const useTemplateEnvelopeBuilder = useScratchBuilder && shouldUseTemplateEnvelopeBuilder(scenario);
  if (useTemplateEnvelopeBuilder) {
    scenario.notes[1] = `Mission graph rebuilt from a stock template envelope for ${input.targetType}.`;
  } else if (useScratchBuilder) {
    scenario.notes[1] = `Mission graph built from scratch for ${input.targetType}.`;
  }

  const requestedBuilderNote = useTemplateEnvelopeBuilder
    ? 'Template-envelope mission builder requested from UI.'
    : useScratchBuilder
      ? 'Scratch mission builder requested from UI.'
      : normalizeBoolean(input.useScratchBuilder)
        ? `Scratch mission builder requested, but ${input.targetType} currently uses the stock template path.`
        : 'Template mission builder requested from UI.';

  scenario.notes[scenario.notes.length - 1] = requestedBuilderNote;

  const missionText = useTemplateEnvelopeBuilder
    ? buildMissionTextFromTemplateEnvelope({ scenario, landscape, supportAircraft, startAirfield })
    : useScratchBuilder
      ? buildScratchMissionText({
          scenario,
          landscape,
          weather,
          enemyCountry: coalitionCountries[enemyFaction] || 501,
          playerCountry: coalitionCountries[friendlyFaction] || 601,
        })
      : buildMissionTextFromTemplate({ scenario, landscape, supportAircraft, startAirfield });
  const coopMissionText = coopFriendly ? buildCoopMissionText(missionText) : null;
  const localizationText = useTemplateEnvelopeBuilder
    ? buildLocalizationTextFromTemplate(scenario, area, chosenTargets)
    : useScratchBuilder
      ? buildScratchLocalizationText(scenario, buildObjectiveText)
      : buildLocalizationTextFromTemplate(scenario, area, chosenTargets);
  const localizationBuffer = Buffer.from(`\uFEFF${localizationText}`, 'utf16le');
  const generatedRoot = getGeneratedRoot();

  fs.mkdirSync(generatedRoot, { recursive: true });
  if (exportToGame) {
    fs.mkdirSync(installInfo.missionExportRoot, { recursive: true });
    if (coopFriendly) {
      fs.mkdirSync(installInfo.multiplayerRoot, { recursive: true });
      fs.mkdirSync(installInfo.coopExportRoot, { recursive: true });
      fs.mkdirSync(installInfo.cooperativeExportRoot, { recursive: true });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  const baseName = `${stamp}_${safeTitle}`;

  const jsonOutputPath = path.join(generatedRoot, `${baseName}.json`);
  const missionOutputPath = path.join(generatedRoot, `${baseName}.Mission`);
  const engOutputPath = path.join(generatedRoot, `${baseName}.eng`);
  const exportMissionPath = exportToGame ? path.join(installInfo.missionExportRoot, `${baseName}.Mission`) : null;
  const exportEngPath = exportToGame ? path.join(installInfo.missionExportRoot, `${baseName}.eng`) : null;
  const coopExportMissionPath = exportToGame && coopFriendly ? path.join(installInfo.coopExportRoot, `${baseName}.Mission`) : null;
  const coopExportEngPath = exportToGame && coopFriendly ? path.join(installInfo.coopExportRoot, `${baseName}.eng`) : null;
  const coopRootExportMissionPath = exportToGame && coopFriendly ? path.join(installInfo.multiplayerRoot, `${baseName}.Mission`) : null;
  const coopRootExportEngPath = exportToGame && coopFriendly ? path.join(installInfo.multiplayerRoot, `${baseName}.eng`) : null;
  const coopExportSdsPath = exportToGame && coopFriendly ? path.join(installInfo.coopExportRoot, `${baseName}.sds`) : null;
  const coopRootExportSdsPath = exportToGame && coopFriendly ? path.join(installInfo.multiplayerRoot, `${baseName}.sds`) : null;
  const cooperativeMissionDir = exportToGame && coopFriendly ? path.join(installInfo.cooperativeExportRoot, baseName) : null;
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
    installInfo,
  };
}

module.exports = {
  buildOptions,
  buildScenario,
};
