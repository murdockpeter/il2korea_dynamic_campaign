const fs = require('fs');
const path = require('path');
const {
  buildCoopMissionText,
  buildCoopSdsText,
  registerCoopMissionInLocalServerSetup,
} = require('../src/generator');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_GAME_MISSIONS = 'C:\\Program Files\\IL2Series\\game\\data\\Missions';
const MISSION_NAME = 'BlackScorpions_001_Suwon_Road';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    args[value.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function list(values) {
  return `[${values.join(',')}]`;
}

function plane({ name, index, entityIndex, x, y, z, formation, aiLevel }) {
  return `Plane
{
  Name = "${name}";
  Index = ${index};
  LinkTrId = ${entityIndex};
  XPos = ${x.toFixed(3)};
  YPos = ${y.toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 56.31;
  ZOri = 0;
  Script = "LuaScripts\\WorldObjects\\Planes\\f80c10.txt";
  Model = "graphics\\planes\\f80c10\\f80c10.mgm";
  Country = 601;
  Desc = "${formation === 0 ? 'PLAYERSQUAD' : ''}";
  Skin = "";
  BotSkin = "";
  AILevel = ${aiLevel};
  CoopStart = 0;
  NumberInFormation = ${formation};
  Vulnerable = 1;
  Engageable = 1;
  LimitAmmo = 1;
  StartType = 0;
  Callsign = 40;
  Callnum = ${formation + 1};
  DamageReport = 50;
  DamageThreshold = 1;
  PayloadId = 2;
  ModMask = 1;
  AiRTBDecision = 0;
  DeleteAfterDeath = 1;
  DeleteAfterLand = 1;
  Spotter = -1;
  Fuel = 0.7;
  TCode = "%20%20%20%20%20%20%20";
  TCodeColor = "000000";
  GunLoad = [];
  GunBelt = [];
  VictoryCount = 0;
  Emblem = 0;
}`;
}

function entity({ index, objectIndex, x, y, z, targets = [], deathTarget = null, enabled = 1 }) {
  const eventText = deathTarget === null
    ? ''
    : `
  OnEvents
  {
    OnEvent
    {
      Type = 13;
      TarId = ${deathTarget};
    }
  }`;
  return `MCU_TR_Entity
{
  Index = ${index};
  Name = "${objectIndex >= 80200 ? 'Vehicle' : 'Plane'} entity";
  Desc = "";
  Targets = ${list(targets)};
  Objects = [];
  XPos = ${x.toFixed(3)};
  YPos = ${(y + 0.2).toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = ${enabled};
  MisObjID = ${objectIndex};${eventText}
}`;
}

function vehicle({ index, entityIndex, x, z, script, model, name }) {
  return `Vehicle
{
  Name = "${name}";
  Index = ${index};
  LinkTrId = ${entityIndex};
  XPos = ${x.toFixed(3)};
  YPos = 0.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 264.0;
  ZOri = 0;
  Script = "${script}";
  Model = "${model}";
  Desc = "";
  Country = 501;
  NumberInFormation = 0;
  Vulnerable = 1;
  Engageable = 1;
  LimitAmmo = 1;
  AILevel = 2;
  DamageReport = 50;
  DamageThreshold = 1;
  DeleteAfterDeath = 1;
  CoopStart = 0;
  Spotter = -1;
  BeaconChannel = 0;
  Callsign = 0;
  PayloadId = 0;
  ModMask = 1;
  Fuel = 1;
  Callnum = 0;
  Skin = "";
  BotSkin = "";
  RepairTimeMultiplier = 0;
  RehealTimeMultiplier = 0;
  RearmTimeMultiplier = 0;
  RefuelTimeMultiplier = 0;
  MaintenanceRadius = 10;
  TCode = "";
  TCodeColor = "";
  TrailerAtStart = 1;
  PinToTerrain = 1;
}`;
}

function waypoint({ index, name, targets, object, x, y, z, area, speed }) {
  return `MCU_Waypoint
{
  Index = ${index};
  Name = "${name}";
  Desc = "";
  Targets = ${list(targets)};
  Objects = [${object}];
  XPos = ${x.toFixed(3)};
  YPos = ${y.toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Area = ${area};
  Speed = ${speed};
  Priority = 1;
}`;
}

function timer({ index, name, targets, time, x, z }) {
  return `MCU_Timer
{
  Index = ${index};
  Name = "${name}";
  Desc = "";
  Targets = ${list(targets)};
  Objects = [];
  XPos = ${x.toFixed(3)};
  YPos = 20.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Time = ${time};
  Random = 100;
}`;
}

function subtitle({ index, lcName, x, z }) {
  return `MCU_TR_Subtitle
{
  Index = ${index};
  Name = "Campaign message";
  Desc = "";
  Targets = [];
  Objects = [];
  XPos = ${x.toFixed(3)};
  YPos = 20.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
  SubtitleInfo
  {
    Duration = 8;
    FontSize = 20;
    HAlign = 1;
    VAlign = 0;
    RColor = 255;
    GColor = 255;
    BColor = 255;
    LCText = ${lcName};
  }
  Coalitions = [2];
}`;
}

function icon({ index, targets = [], x, z, lcName, lcDesc, iconId, r, g, b, lineType, coalitions }) {
  return `MCU_Icon
{
  Index = ${index};
  Targets = ${list(targets)};
  Objects = [];
  XPos = ${x.toFixed(3)};
  YPos = 30.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
  LCName = ${lcName};
  LCDesc = ${lcDesc};
  IconId = ${iconId};
  RColor = ${r};
  GColor = ${g};
  BColor = ${b};
  LineType = ${lineType};
  Coalitions = ${list(coalitions)};
}`;
}

function indentBlock(block, spaces = 2) {
  const padding = ' '.repeat(spaces);
  return block.split('\n').map((line) => `${padding}${line}`).join('\n');
}

function buildMissionLayer() {
  const leaderEntity = 80002;
  const deathCounter = 80290;
  const blocks = [];

  const planes = [
    { name: 'Scorpion 1', index: 80001, entityIndex: 80002, x: 45000, y: 2200, z: 310000, formation: 0, aiLevel: 0 },
    { name: 'Scorpion 2', index: 80003, entityIndex: 80004, x: 44940, y: 2190, z: 310040, formation: 1, aiLevel: 2 },
    { name: 'Scorpion 3', index: 80005, entityIndex: 80006, x: 44880, y: 2180, z: 310080, formation: 2, aiLevel: 2 },
    { name: 'Scorpion 4', index: 80007, entityIndex: 80008, x: 44820, y: 2170, z: 310120, formation: 3, aiLevel: 2 },
  ];
  for (const item of planes) {
    blocks.push(plane(item));
    blocks.push(entity({
      index: item.entityIndex,
      objectIndex: item.index,
      x: item.x,
      y: item.y,
      z: item.z,
      targets: item.formation === 0 ? [] : [leaderEntity],
    }));
  }

  blocks.push(`MCU_TR_MissionBegin
{
  Index = 80100;
  Name = "Mission Begin";
  Desc = "";
  Targets = [80101];
  Objects = [];
  XPos = 10000.000;
  YPos = 20.000;
  ZPos = 314000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
}`);
  blocks.push(timer({ index: 80101, name: '1s initialization', targets: [80102, 80110], time: 1, x: 11000, z: 314000 }));
  blocks.push(`MCU_CMD_Formation
{
  Index = 80102;
  Name = "Scorpion formation";
  Desc = "";
  Targets = [];
  Objects = [${leaderEntity}];
  XPos = 12000.000;
  YPos = 2200.000;
  ZPos = 314000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  FormationType = 1;
  FormationDensity = 1;
  FlightSize = -1;
  WaitForWingmen = 0;
}`);

  blocks.push(waypoint({ index: 80110, name: 'Coast Ingress', targets: [80111], object: leaderEntity, x: 52000, y: 2200, z: 302000, area: 1800, speed: 650 }));
  blocks.push(waypoint({ index: 80111, name: 'Suwon Road IP', targets: [80120, 80121, 80122], object: leaderEntity, x: 59000, y: 1500, z: 295000, area: 1500, speed: 650 }));
  blocks.push(`MCU_CMD_AttackArea
{
  Index = 80120;
  Name = "Attack Suwon road advance guard";
  Desc = "";
  Targets = [];
  Objects = [${leaderEntity}];
  XPos = 64500.000;
  YPos = 900.000;
  ZPos = 289700.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  AttackGround = 1;
  AttackAir = 0;
  AttackGTargets = 0;
  AttackArea = 4000;
  Time = 240;
  Priority = 1;
}`);
  blocks.push(timer({ index: 80121, name: '4m attack window', targets: [80123, 80112, 80124], time: 240, x: 53500, z: 294000 }));
  blocks.push(subtitle({ index: 80122, lcName: 9, x: 54000, z: 294000 }));
  blocks.push(`MCU_CMD_ForceComplete
{
  Index = 80123;
  Name = "End attack phase";
  Desc = "";
  Targets = [];
  Objects = [${leaderEntity}];
  XPos = 56000.000;
  YPos = 20.000;
  ZPos = 294000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Priority = 1;
  EmergencyOrdnanceDrop = 0;
}`);
  blocks.push(subtitle({ index: 80124, lcName: 10, x: 57000, z: 294000 }));
  blocks.push(waypoint({ index: 80112, name: 'Egress South', targets: [80113], object: leaderEntity, x: 35000, y: 1900, z: 305000, area: 2200, speed: 700 }));
  blocks.push(waypoint({ index: 80113, name: 'Exit to Itazuke', targets: [80130, 80131], object: leaderEntity, x: 6000, y: 2200, z: 320000, area: 3000, speed: 700 }));
  blocks.push(subtitle({ index: 80130, lcName: 11, x: 7000, z: 319000 }));
  blocks.push(timer({ index: 80131, name: '10s mission end', targets: [80132], time: 10, x: 8000, z: 319000 }));
  blocks.push(`MCU_TR_MissionEnd
{
  Index = 80132;
  Name = "Mission End";
  Desc = "";
  Targets = [];
  Objects = [];
  XPos = 9000.000;
  YPos = 20.000;
  ZPos = 319000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
}`);

  const targets = [
    { index: 80201, entityIndex: 80202, x: 65550, z: 289180, script: 'LuaScripts\\WorldObjects\\vehicles\\isu122.txt', model: 'graphics\\vehicles\\isu122\\isu122.mgm', name: 'DPRK Assault Gun 1' },
    { index: 80203, entityIndex: 80204, x: 65020, z: 289300, script: 'LuaScripts\\WorldObjects\\vehicles\\isu122.txt', model: 'graphics\\vehicles\\isu122\\isu122.mgm', name: 'DPRK Assault Gun 2' },
    { index: 80205, entityIndex: 80206, x: 64500, z: 289420, script: 'LuaScripts\\WorldObjects\\vehicles\\gaz63.txt', model: 'graphics\\vehicles\\gaz63\\gaz63.mgm', name: 'DPRK Transport 1' },
    { index: 80207, entityIndex: 80208, x: 64000, z: 289550, script: 'LuaScripts\\WorldObjects\\vehicles\\studebakerus6.txt', model: 'graphics\\vehicles\\studebakerus6\\studebakerus6.mgm', name: 'DPRK Transport 2' },
    { index: 80209, entityIndex: 80210, x: 63500, z: 289680, script: 'LuaScripts\\WorldObjects\\vehicles\\gaz63.txt', model: 'graphics\\vehicles\\gaz63\\gaz63.mgm', name: 'DPRK Transport 3' },
    { index: 80211, entityIndex: 80212, x: 63000, z: 289810, script: 'LuaScripts\\WorldObjects\\vehicles\\studebakerus6-tanker.txt', model: 'graphics\\vehicles\\studebakerus6-tanker\\studebakerus6-tanker.mgm', name: 'DPRK Fuel Truck' },
    { index: 80213, entityIndex: 80214, x: 65080, z: 289610, script: 'LuaScripts\\WorldObjects\\vehicles\\squad-mg-1950-dprk.txt', model: 'graphics\\vehicles\\infantry\\squad-mg-1950-dprk.mgm', name: 'DPRK MG Squad' },
    { index: 80215, entityIndex: 80216, x: 64050, z: 289820, script: 'LuaScripts\\WorldObjects\\vehicles\\squad-smg-1950-dprk.txt', model: 'graphics\\vehicles\\infantry\\squad-smg-1950-dprk.mgm', name: 'DPRK SMG Squad' },
    { index: 80217, entityIndex: 80218, x: 63200, z: 290020, script: 'LuaScripts\\WorldObjects\\vehicles\\squad-mg-1950-dprk.txt', model: 'graphics\\vehicles\\infantry\\squad-mg-1950-dprk.mgm', name: 'DPRK Rear Guard' },
  ];
  for (const item of targets) {
    blocks.push(vehicle(item));
    blocks.push(entity({ index: item.entityIndex, objectIndex: item.index, x: item.x, y: 0, z: item.z, deathTarget: deathCounter }));
  }

  blocks.push(`MCU_Counter
{
  Index = ${deathCounter};
  Name = "Four ground targets destroyed";
  Desc = "";
  Targets = [80291,80292];
  Objects = [];
  XPos = 64500.000;
  YPos = 20.000;
  ZPos = 291000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Counter = 4;
  Dropcount = 0;
}`);
  blocks.push(`MCU_TR_MissionObjective
{
  Index = 80291;
  Targets = [];
  Objects = [];
  XPos = 64500.000;
  YPos = 20.000;
  ZPos = 291500.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
  LCName = 3;
  LCDesc = 4;
  TaskType = 0;
  Coalition = 2;
  Success = 1;
  IconType = 559;
}`);
  blocks.push(subtitle({ index: 80292, lcName: 12, x: 65000, z: 291500 }));
  blocks.push(icon({ index: 80295, x: 64500, z: 289700, lcName: 7, lcDesc: 8, iconId: 511, r: 255, g: 0, b: 0, lineType: 0, coalitions: [2] }));

  const front = [
    [60000, 275000],
    [74728.271, 288926.493],
    [77000, 320000],
    [81000, 350000],
    [84044.120, 372217.851],
    [87500, 405000],
    [92000, 445000],
    [96864, 488527],
  ];
  front.forEach(([x, z], offset) => {
    const index = 80300 + offset;
    const targets = offset < front.length - 1 ? [index + 1] : [];
    blocks.push(icon({ index, targets, x, z, lcName: 5, lcDesc: 6, iconId: 0, r: 0, g: 0, b: 10, lineType: 13, coalitions: [0, 1, 2] }));
  });

  return `Group
{
  Name = "CAMPAIGN - Black Scorpions 001";
  Index = 80000;
  Desc = "4 July 1950 Suwon road interdiction";

${blocks.map((block) => indentBlock(block)).join('\n\n')}
}`;
}

function replaceOption(text, key, value) {
  const pattern = new RegExp(`(^\\s*${key}\\s*=\\s*)[^;]+;`, 'm');
  if (!pattern.test(text)) throw new Error(`Could not find mission option ${key}`);
  return text.replace(pattern, `$1${value};`);
}

function buildMission(sourceText) {
  const sentinel = /\r?\n\r?\n\r?\nPlane\r?\n\{\r?\n  Name = "Plane";\r?\n  Index = 70945;/;
  const match = sentinel.exec(sourceText);
  if (!match) throw new Error('Could not isolate the handmade layer in F80_vs_Infantry_And_Armor_1.Mission');

  let mission = sourceText.slice(0, match.index).trimEnd();
  mission = replaceOption(mission, 'Time', '8:30:0');
  mission = replaceOption(mission, 'Date', '4.7.1950');
  mission = replaceOption(mission, 'HMap', '"graphics\\LANDSCAPE_Korea_su\\height.hini"');
  mission = replaceOption(mission, 'Textures', '"graphics\\LANDSCAPE_Korea_su\\textures.tini"');
  mission = replaceOption(mission, 'Forests', '"graphics\\LANDSCAPE_Korea_su\\trees\\woods.wds"');
  mission = replaceOption(mission, 'SeasonPrefix', '"su"');
  mission = replaceOption(mission, 'CloudLevel', '1500');
  mission = replaceOption(mission, 'CloudHeight', '2800');
  mission = replaceOption(mission, 'PrecLevel', '0');
  mission = replaceOption(mission, 'PrecType', '0');
  mission = replaceOption(mission, 'CloudConfig', '"summer\\02_Medium_06\\sky.ini"');
  mission = replaceOption(mission, 'Temperature', '25');
  mission = replaceOption(mission, 'Haze', '0.08');
  mission = replaceOption(mission, 'LayerFog', '0');

  const result = `${mission}\n\n\n${buildMissionLayer()}\n\n# end of file\n`;
  return result.replace(/\r?\n/g, '\r\n');
}

function buildEnglishText() {
  return [
    '0:Black Scorpions 001 - Suwon Road Interdiction',
    '1:4 July 1950, 08:30.<br><br>The North Korean advance is reported along the Suwon-Wonju-Samcheok line. An armored advance guard with transports has pushed south of Suwon toward Osan.<br><br>Your four-ship F-80C flight has already crossed from Itazuke. Enter the Suwon-Osan corridor, identify military traffic near the marked contact, and attack armor, fuel, and transport vehicles. Enemy troops are dispersed around the road column.<br><br>Destroy at least four ground elements, then follow the egress route toward the southern map boundary. The mission ends after the flight reaches the Itazuke exit point.<br><br>Rules of engagement: attack only positively identified military targets. The front line is an intelligence estimate, not a continuous defended trench line.',
    '2:Peter Robbins / AI-assisted campaign staff',
    '3:Interdict the Suwon road advance guard',
    '4:Destroy at least four armored, transport, fuel, or infantry elements.',
    '5:Estimated front - 4 July 1950',
    '6:Operational estimate: Suwon-Wonju-Samcheok. Local penetrations may lie south of the line.',
    '7:Reported enemy road column',
    '8:Armor and transport reported moving south from Suwon. Exact composition is uncertain.',
    '9:Scorpion flight, target area ahead. Identify military traffic before attacking.',
    '10:Attack window closed. Reform and follow the egress route for Itazuke.',
    '11:Scorpion flight clear of the operational area. Mission ending.',
    '12:Interdiction threshold met: four enemy ground elements destroyed.',
  ].join('\r\n') + '\r\n';
}

function writePackage(directory, missionText, englishText) {
  fs.mkdirSync(directory, { recursive: true });
  const missionPath = path.join(directory, `${MISSION_NAME}.Mission`);
  const englishPath = path.join(directory, `${MISSION_NAME}.eng`);
  fs.writeFileSync(missionPath, missionText, 'utf8');
  fs.writeFileSync(englishPath, englishText, 'utf8');
  return { missionPath, englishPath };
}

function writeCoopPackage(directory, missionText, englishText, sdsText) {
  const files = writePackage(directory, missionText, englishText);
  const sdsPath = path.join(directory, `${MISSION_NAME}.sds`);
  fs.writeFileSync(sdsPath, sdsText, 'utf8');
  return { ...files, sdsPath };
}

function coopScenarioMetadata() {
  return {
    title: 'Black Scorpions 001 - Suwon Road Interdiction',
    aircraft: { player: 'f80c10' },
    filters: { targetType: 'Ground Attack' },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameMissions = path.resolve(args['game-missions'] || DEFAULT_GAME_MISSIONS);
  const sourcePath = path.resolve(args.source || path.join(gameMissions, 'F80_vs_Infantry_And_Armor_1.Mission'));
  const generatedDirectory = path.resolve(args.output || path.join(REPO_ROOT, 'generated', MISSION_NAME));
  const generatedCoopDirectory = path.resolve(
    args['coop-output'] || path.join(REPO_ROOT, 'generated', `${MISSION_NAME}_COOP`)
  );
  if (!fs.existsSync(sourcePath)) throw new Error(`Source mission not found: ${sourcePath}`);

  const missionText = buildMission(fs.readFileSync(sourcePath, 'utf8'));
  const coopMissionText = buildCoopMissionText(missionText);
  const englishText = buildEnglishText();
  const generated = writePackage(generatedDirectory, missionText, englishText);
  const game = writePackage(gameMissions, missionText, englishText);

  const gameData = path.dirname(gameMissions);
  const multiplayerRoot = path.join(gameData, 'Multiplayer');
  const coopCompatibilityRoot = path.join(multiplayerRoot, 'COOP');
  const cooperativeRoot = path.join(multiplayerRoot, 'Cooperative', MISSION_NAME);
  const metadata = coopScenarioMetadata();

  const generatedCoop = writeCoopPackage(
    generatedCoopDirectory,
    coopMissionText,
    englishText,
    buildCoopSdsText(metadata, `Cooperative/${MISSION_NAME}/${MISSION_NAME}.Mission`)
  );
  const cooperative = writeCoopPackage(
    cooperativeRoot,
    coopMissionText,
    englishText,
    buildCoopSdsText(metadata, `Cooperative/${MISSION_NAME}/${MISSION_NAME}.Mission`)
  );
  const coopCompatibility = writeCoopPackage(
    coopCompatibilityRoot,
    coopMissionText,
    englishText,
    buildCoopSdsText(metadata, `${MISSION_NAME}.Mission`)
  );
  const multiplayerCompatibility = writeCoopPackage(
    multiplayerRoot,
    coopMissionText,
    englishText,
    buildCoopSdsText(metadata, `COOP/${MISSION_NAME}.Mission`)
  );

  registerCoopMissionInLocalServerSetup([
    `Multiplayer/Cooperative/${MISSION_NAME}/${MISSION_NAME}`,
    `Multiplayer/${MISSION_NAME}`,
    `Multiplayer/COOP/${MISSION_NAME}`,
  ]);

  process.stdout.write(JSON.stringify({
    sourcePath,
    singlePlayer: { generated, game },
    coop: { generatedCoop, cooperative, coopCompatibility, multiplayerCompatibility },
  }, null, 2));
}

if (require.main === module) main();

module.exports = { buildMission, buildMissionLayer, buildEnglishText, coopScenarioMetadata };
