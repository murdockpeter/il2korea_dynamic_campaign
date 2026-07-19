const fs = require('fs');
const path = require('path');

const { buildMission: buildBaseMission } = require('./build_black_scorpions_001');
const {
  buildCoopMissionText,
  buildCoopSdsText,
  registerCoopMissionInLocalServerSetup,
} = require('../src/generator');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_GAME_MISSIONS = 'C:\\Program Files\\IL2Series\\game\\data\\Missions';
const MISSION_NAME = 'BlackScorpions_002_Osan_Road_Hunt';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function list(values) {
  return `[${values.join(',')}]`;
}

function indent(block, spaces = 2) {
  const pad = ' '.repeat(spaces);
  return block.split('\n').map((line) => `${pad}${line}`).join('\n');
}

function aircraft({ name, index, entityIndex, x, y, z, yaw, script, model, country, desc = '', aiLevel, coopStart = 0, formation, callsign, callnum, payloadId, modMask, fuel = 0.7 }) {
  return `Plane
{
  Name = "${name}";
  Index = ${index};
  LinkTrId = ${entityIndex};
  XPos = ${x.toFixed(3)};
  YPos = ${y.toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = ${yaw};
  ZOri = 0;
  Script = "${script}";
  Model = "${model}";
  Country = ${country};
  Desc = "${desc}";
  Skin = "";
  BotSkin = "";
  AILevel = ${aiLevel};
  CoopStart = ${coopStart};
  NumberInFormation = ${formation};
  Vulnerable = 1;
  Engageable = 1;
  LimitAmmo = 1;
  StartType = 0;
  Callsign = ${callsign};
  Callnum = ${callnum};
  DamageReport = 50;
  DamageThreshold = 1;
  PayloadId = ${payloadId};
  ModMask = ${modMask};
  AiRTBDecision = 0;
  DeleteAfterDeath = 1;
  DeleteAfterLand = 0;
  Spotter = -1;
  Fuel = ${fuel};
  TCode = "";
  TCodeColor = "000000";
  GunLoad = [];
  GunBelt = [];
  VictoryCount = 0;
  Emblem = 0;
}`;
}

function entity({ index, objectIndex, name, x, y, z, targets = [], enabled = 1, deathTarget = null }) {
  const events = deathTarget === null ? '' : `
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
  Name = "${name}";
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
  MisObjID = ${objectIndex};${events}
}`;
}

function vehicle({ name, index, entityIndex, x, z, yaw, script, model, formation }) {
  return `Vehicle
{
  Name = "${name}";
  Index = ${index};
  LinkTrId = ${entityIndex};
  XPos = ${x.toFixed(3)};
  YPos = 0.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = ${yaw};
  ZOri = 0;
  Script = "${script}";
  Model = "${model}";
  Desc = "";
  Country = 501;
  NumberInFormation = ${formation};
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

function waypoint({ index, name, targets, objects, x, y, z, area, speed, priority = 1 }) {
  return `MCU_Waypoint
{
  Index = ${index};
  Name = "${name}";
  Desc = "";
  Targets = ${list(targets)};
  Objects = ${list(objects)};
  XPos = ${x.toFixed(3)};
  YPos = ${y.toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Area = ${area};
  Speed = ${speed};
  Priority = ${priority};
}`;
}

function timer({ index, name, targets, time, random = 100, x, z }) {
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
  Random = ${random};
}`;
}

function subtitle({ index, lcText, targets = [], x, z }) {
  return `MCU_TR_Subtitle
{
  Index = ${index};
  Name = "Campaign message";
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
    LCText = ${lcText};
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

function formation({ index, name, object, x, y, z, density = 1 }) {
  return `MCU_CMD_Formation
{
  Index = ${index};
  Name = "${name}";
  Desc = "";
  Targets = [];
  Objects = [${object}];
  XPos = ${x.toFixed(3)};
  YPos = ${y.toFixed(3)};
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  FormationType = 1;
  FormationDensity = ${density};
  FlightSize = -1;
  WaitForWingmen = 0;
}`;
}

function forceComplete({ index, name, object, x, z }) {
  return `MCU_CMD_ForceComplete
{
  Index = ${index};
  Name = "${name}";
  Desc = "";
  Targets = [];
  Objects = [${object}];
  XPos = ${x.toFixed(3)};
  YPos = 20.000;
  ZPos = ${z.toFixed(3)};
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Priority = 1;
  EmergencyOrdnanceDrop = 0;
}`;
}

function buildMissionLayer() {
  const blocks = [];
  const playerLeader = 81002;
  const escortLeader = 81102;
  const yakLeader = 81202;
  const convoyLeader = 81302;
  const resultCounter = 81400;

  const playerPositions = [
    [45000, 2200, 325000], [44940, 2190, 325040], [44880, 2180, 325080], [44820, 2170, 325120],
  ];
  playerPositions.forEach(([x, y, z], i) => {
    const index = 81001 + i * 2;
    const entityIndex = index + 1;
    blocks.push(aircraft({ name: `Scorpion ${i + 1}`, index, entityIndex, x, y, z, yaw: 70, script: 'LuaScripts\\WorldObjects\\Planes\\f80c10.txt', model: 'graphics\\planes\\f80c10\\f80c10.mgm', country: 601, desc: i === 0 ? 'PLAYERSQUAD' : '', aiLevel: i === 0 ? 0 : 2, formation: i, callsign: 40, callnum: i + 1, payloadId: 2, modMask: 1 }));
    blocks.push(entity({ index: entityIndex, objectIndex: index, name: `Scorpion ${i + 1} entity`, x, y, z, targets: i === 0 ? [] : [playerLeader] }));
  });

  const escortPositions = [[44200, 2850, 323800], [44110, 2840, 323880]];
  escortPositions.forEach(([x, y, z], i) => {
    const index = 81101 + i * 2;
    const entityIndex = index + 1;
    blocks.push(aircraft({ name: `Falcon ${i + 1} Top Cover`, index, entityIndex, x, y, z, yaw: 70, script: 'LuaScripts\\WorldObjects\\Planes\\f80c10.txt', model: 'graphics\\planes\\f80c10\\f80c10.mgm', country: 601, aiLevel: 1, formation: i, callsign: 11, callnum: i + 1, payloadId: 0, modMask: 0, fuel: 0.8 }));
    blocks.push(entity({ index: entityIndex, objectIndex: index, name: `Falcon ${i + 1} entity`, x, y, z, targets: i === 0 ? [] : [escortLeader] }));
  });

  const yakPositions = [[90000, 3200, 295000], [90110, 3190, 295080]];
  yakPositions.forEach(([x, y, z], i) => {
    const index = 81201 + i * 2;
    const entityIndex = index + 1;
    blocks.push(aircraft({ name: `DPRK Yak ${i + 1}`, index, entityIndex, x, y, z, yaw: 235, script: 'LuaScripts\\WorldObjects\\Planes\\yak9p.txt', model: 'graphics\\planes\\yak9p\\yak9p.mgm', country: 501, aiLevel: 1, formation: i, callsign: 7, callnum: i + 1, payloadId: 0, modMask: 0, fuel: 0.75 }));
    blocks.push(entity({ index: entityIndex, objectIndex: index, name: `DPRK Yak ${i + 1} entity`, x, y, z, targets: i === 0 ? [] : [yakLeader], enabled: 0 }));
  });

  blocks.push(`MCU_TR_MissionBegin
{
  Index = 81050;
  Name = "Mission Begin";
  Desc = "";
  Targets = [81051];
  Objects = [];
  XPos = 45000.000;
  YPos = 20.000;
  ZPos = 324000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
}`);
  blocks.push(timer({ index: 81051, name: '1s initialization', targets: [81052,81060,81110,81111,81220,81350], time: 1, x: 46000, z: 324000 }));
  blocks.push(formation({ index: 81052, name: 'Scorpion formation', object: playerLeader, x: 46500, y: 2200, z: 324000 }));
  blocks.push(waypoint({ index: 81060, name: 'Rejoin top cover', targets: [81061], objects: [playerLeader], x: 55000, y: 2200, z: 320000, area: 1800, speed: 650 }));
  blocks.push(waypoint({ index: 81061, name: 'Osan search corridor', targets: [81070,81071,81072], objects: [playerLeader], x: 64000, y: 1500, z: 316000, area: 2500, speed: 620 }));
  blocks.push(`MCU_CMD_AttackArea
{
  Index = 81070;
  Name = "Armed reconnaissance Osan road";
  Desc = "";
  Targets = [];
  Objects = [${playerLeader}];
  XPos = 67000.000;
  YPos = 900.000;
  ZPos = 318000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  AttackGround = 1;
  AttackAir = 0;
  AttackGTargets = 0;
  AttackArea = 6500;
  Time = 360;
  Priority = 1;
}`);
  blocks.push(timer({ index: 81071, name: '6m search and attack window', targets: [81073,81062,81074], time: 360, x: 65000, z: 314500 }));
  blocks.push(subtitle({ index: 81072, lcText: 9, x: 65500, z: 315000 }));
  blocks.push(forceComplete({ index: 81073, name: 'End armed reconnaissance', object: playerLeader, x: 62000, z: 324000 }));
  blocks.push(subtitle({ index: 81074, lcText: 10, x: 62500, z: 324500 }));
  blocks.push(waypoint({ index: 81062, name: 'Egress southwest', targets: [81063], objects: [playerLeader], x: 48000, y: 2100, z: 330000, area: 2200, speed: 700 }));
  blocks.push(waypoint({ index: 81063, name: 'Exit for Itazuke', targets: [81080,81081], objects: [playerLeader], x: 12000, y: 2200, z: 337000, area: 3000, speed: 700 }));
  blocks.push(subtitle({ index: 81080, lcText: 11, x: 13000, z: 336000 }));
  blocks.push(timer({ index: 81081, name: '10s mission end', targets: [81082], time: 10, x: 14000, z: 336000 }));
  blocks.push(`MCU_TR_MissionEnd
{
  Index = 81082;
  Name = "Mission End";
  Desc = "";
  Targets = [];
  Objects = [];
  XPos = 15000.000;
  YPos = 20.000;
  ZPos = 336000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Enabled = 1;
}`);

  blocks.push(formation({ index: 81110, name: 'Falcon top-cover formation', object: escortLeader, x: 44500, y: 2850, z: 322500, density: 0 }));
  blocks.push(`MCU_CMD_Cover
{
  Index = 81111;
  Name = "Falcon cover Scorpion flight";
  Desc = "";
  Targets = [${playerLeader}];
  Objects = [${escortLeader}];
  XPos = 45000.000;
  YPos = 2800.000;
  ZPos = 323000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  CoverGroup = 1;
  Priority = 1;
}`);

  blocks.push(timer({ index: 81220, name: 'Possible Yak interception', targets: [81221,81222], time: 140, random: 50, x: 76000, z: 300000 }));
  blocks.push(`MCU_Activate
{
  Index = 81221;
  Name = "Activate Yak patrol";
  Desc = "";
  Targets = [];
  Objects = [81202,81204];
  XPos = 79000.000;
  YPos = 20.000;
  ZPos = 299000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
}`);
  blocks.push(timer({ index: 81222, name: '1s Yak activation delay', targets: [81223,81224,81225,81228], time: 1, x: 80000, z: 299000 }));
  blocks.push(`MCU_CMD_AttackArea
{
  Index = 81223;
  Name = "Yak intercept search";
  Desc = "";
  Targets = [];
  Objects = [${yakLeader}];
  XPos = 65000.000;
  YPos = 2600.000;
  ZPos = 313000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  AttackGround = 0;
  AttackAir = 1;
  AttackGTargets = 0;
  AttackArea = 30000;
  Time = 360;
  Priority = 1;
}`);
  blocks.push(timer({ index: 81224, name: '6m Yak combat window', targets: [81226,81227], time: 360, x: 81000, z: 299000 }));
  blocks.push(subtitle({ index: 81225, lcText: 12, x: 67000, z: 310000 }));
  blocks.push(forceComplete({ index: 81226, name: 'Yak disengage', object: yakLeader, x: 82000, z: 298000 }));
  blocks.push(waypoint({ index: 81227, name: 'Yak withdrawal north', targets: [], objects: [yakLeader], x: 110000, y: 3200, z: 275000, area: 3000, speed: 520 }));
  blocks.push(formation({ index: 81228, name: 'Yak patrol formation', object: yakLeader, x: 88000, y: 3200, z: 296000, density: 0 }));

  const convoy = [
    ['DPRK Column Leader',81301,81302,67200,306000,'LuaScripts\\WorldObjects\\vehicles\\isu122.txt','graphics\\vehicles\\isu122\\isu122.mgm'],
    ['DPRK Assault Gun 2',81303,81304,67240,305930,'LuaScripts\\WorldObjects\\vehicles\\isu122.txt','graphics\\vehicles\\isu122\\isu122.mgm'],
    ['DPRK Transport 1',81305,81306,67280,305860,'LuaScripts\\WorldObjects\\vehicles\\gaz63.txt','graphics\\vehicles\\gaz63\\gaz63.mgm'],
    ['DPRK Transport 2',81307,81308,67320,305790,'LuaScripts\\WorldObjects\\vehicles\\studebakerus6.txt','graphics\\vehicles\\studebakerus6\\studebakerus6.mgm'],
    ['DPRK Transport 3',81309,81310,67360,305720,'LuaScripts\\WorldObjects\\vehicles\\gaz63.txt','graphics\\vehicles\\gaz63\\gaz63.mgm'],
    ['DPRK Fuel Truck',81311,81312,67400,305650,'LuaScripts\\WorldObjects\\vehicles\\studebakerus6-tanker.txt','graphics\\vehicles\\studebakerus6-tanker\\studebakerus6-tanker.mgm'],
    ['DPRK Troop Truck',81313,81314,67440,305580,'LuaScripts\\WorldObjects\\vehicles\\studebakerus6.txt','graphics\\vehicles\\studebakerus6\\studebakerus6.mgm'],
  ];
  convoy.forEach(([name,index,entityIndex,x,z,script,model], i) => {
    blocks.push(vehicle({ name, index, entityIndex, x, z, yaw: 180, script, model, formation: i }));
    blocks.push(entity({ index: entityIndex, objectIndex: index, name: `${name} entity`, x, y: 0, z, targets: i === 0 ? [] : [convoyLeader], deathTarget: resultCounter }));
  });
  blocks.push(waypoint({ index: 81350, name: 'Column south 1', targets: [81351], objects: [convoyLeader], x: 67400, y: 0, z: 313000, area: 120, speed: 12, priority: 1 }));
  blocks.push(waypoint({ index: 81351, name: 'Column south 2', targets: [81352], objects: [convoyLeader], x: 67000, y: 0, z: 321000, area: 120, speed: 12, priority: 1 }));
  blocks.push(waypoint({ index: 81352, name: 'Column destination', targets: [], objects: [convoyLeader], x: 66300, y: 0, z: 329000, area: 150, speed: 12, priority: 1 }));

  blocks.push(`MCU_Counter
{
  Index = 81400;
  Name = "Three convoy elements destroyed";
  Desc = "";
  Targets = [81401,81402];
  Objects = [];
  XPos = 68000.000;
  YPos = 20.000;
  ZPos = 318000.000;
  XOri = 0;
  YOri = 0;
  ZOri = 0;
  TransformParentID = -1;
  Counter = 3;
  Dropcount = 0;
}`);
  blocks.push(`MCU_TR_MissionObjective
{
  Index = 81401;
  Targets = [];
  Objects = [];
  XPos = 68000.000;
  YPos = 20.000;
  ZPos = 318500.000;
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
  blocks.push(subtitle({ index: 81402, lcText: 13, x: 68500, z: 318500 }));
  blocks.push(icon({ index: 81410, x: 67000, z: 318000, lcName: 7, lcDesc: 8, iconId: 511, r: 255, g: 128, b: 0, lineType: 0, coalitions: [2] }));

  const routeIcons = [
    [81600,81601,45000,325000,14,15,903],
    [81601,81602,55000,320000,16,17,901],
    [81602,81603,64000,316000,18,19,902],
    [81603,81604,48000,330000,20,21,901],
    [81604,null,12000,337000,22,23,901],
  ];
  routeIcons.forEach(([index,next,x,z,lcName,lcDesc,iconId]) => {
    blocks.push(icon({ index, targets: next === null ? [] : [next], x, z, lcName, lcDesc, iconId, r: 0, g: 0, b: 0, lineType: 14, coalitions: [2] }));
  });

  const front = [[60000,292000],[68000,305000],[77000,320000],[81000,350000],[84044.120,372217.851],[87500,405000],[92000,445000],[96864,488527]];
  front.forEach(([x,z], i) => blocks.push(icon({ index: 81500+i, targets: i < front.length-1 ? [81501+i] : [], x, z, lcName: 5, lcDesc: 6, iconId: 0, r: 0, g: 0, b: 10, lineType: 13, coalitions: [0,1,2] })));

  return `Group
{
  Name = "CAMPAIGN - Black Scorpions 002";
  Index = 81000;
  Desc = "4 July 1950 Osan road armed reconnaissance";

${blocks.map((block) => indent(block)).join('\n\n')}
}`;
}

function replaceOption(text, key, value) {
  const pattern = new RegExp(`(^\\s*${key}\\s*=\\s*)[^;]+;`, 'm');
  if (!pattern.test(text)) throw new Error(`Could not find mission option ${key}`);
  return text.replace(pattern, `$1${value};`);
}

function buildMission(sourceText) {
  let mission = buildBaseMission(sourceText).replace(/\r\n/g, '\n');
  const start = mission.lastIndexOf('Group\n{\n  Name = "CAMPAIGN - Black Scorpions 001";');
  const end = mission.lastIndexOf('\n\n# end of file');
  if (start < 0 || end < start) throw new Error('Could not replace the Black Scorpions 001 campaign layer');
  mission = `${mission.slice(0, start)}${buildMissionLayer()}${mission.slice(end)}`;
  mission = replaceOption(mission, 'Time', '14:30:0');
  mission = replaceOption(mission, 'Date', '4.7.1950');
  mission = replaceOption(mission, 'CloudLevel', '1500');
  mission = replaceOption(mission, 'CloudHeight', '2800');
  mission = replaceOption(mission, 'CloudConfig', '"summer\\02_Medium_06\\sky.ini"');
  mission = replaceOption(mission, 'Haze', '0.08');
  return mission.replace(/\r?\n/g, '\r\n');
}

function buildEnglishText() {
  return [
    '0:Black Scorpions 002 - Osan Road Hunt',
    '1:4 July 1950 - 1430 hours.<br><br>SITUATION<br>This morning, Scorpion flight failed to damage the North Korean advance guard reported south of Suwon. With no delay imposed, the formation has continued down the Suwon-Osan road. Its exact position is no longer known. The western sector of the estimated front has consequently moved south, while the central and eastern sectors remain largely unchanged.<br><br>MISSION<br>Scorpion flight will conduct armed reconnaissance through the marked Osan road corridor. Locate the moving DPRK column and destroy at least three armored, fuel, or transport vehicles. Three confirmed vehicle kills will impose a meaningful delay; destruction of the entire formation is not required.<br><br>EXECUTION<br>You begin airborne at the AIRBORNE START marker at approximately <m-ft>2200</m-ft>. Proceed northeast to REJOIN FALCON, then continue to SEARCH AREA ENTRY. The orange OSAN ROAD SEARCH CORRIDOR marker is based on the column last known position, not its guaranteed present location. Search along the road in the reported direction of travel. You have six minutes in the action area before the flight is ordered to reform at EGRESS SOUTHWEST and proceed to the ITAZUKE EXIT marker.<br><br>PACKAGE<br>Scorpion: four F-80C fighter-bombers, player strike element.<br>Falcon: two AI F-80Cs providing dedicated top cover at approximately <m-ft>2850</m-ft>.<br><br>THREATS<br>DPRK Yak-9 activity is possible but unconfirmed. Falcon is assigned to protect the strike flight and should engage an interception. Scorpion should remain focused on the ground task unless directly threatened. Expect small-arms and vehicle-mounted fire in the convoy area.<br><br>RULES OF ENGAGEMENT<br>Attack positively identified military vehicles only. Civilian traffic is not a target. Avoid firing toward marked friendly territory. The displayed front is an intelligence estimate and may not precisely separate opposing ground forces.<br><br>WEATHER<br>Broken cloud with light haze. No precipitation. Calm winds and no significant turbulence. Temperature <c-f>25</c-f>.<br><br>RECOVERY<br>After six minutes in the search area, break off, reform with Falcon, and follow the southwest egress. The mission ends after the package reaches the Itazuke exit point.',
    '2:Peter Robbins / AI-assisted campaign staff',
    '3:Reacquire and delay the Osan road column',
    '4:Destroy at least three moving armored, fuel, or transport elements.',
    '5:Estimated front - 4 July 1950 afternoon',
    '6:The western sector has moved south under continued pressure; central and eastern estimates remain less changed.',
    '7:Osan road search corridor',
    '8:Last-known movement south. The convoy may have advanced beyond the center of this marker.',
    '9:Scorpion flight, begin armed reconnaissance. Falcon flight is covering above.',
    '10:Search window closed. Reform and exit southwest for Itazuke.',
    '11:Scorpion and Falcon flights clear of the operational area. Mission ending.',
    '12:Falcon flight, possible hostile fighters northeast of the search corridor.',
    '13:Three convoy elements destroyed. Enemy movement has been delayed.',
    '14:Airborne Start',
    '15:Scorpion flight begins airborne at approximately 2,200 meters after the transit from Itazuke.',
    '16:Rejoin Falcon',
    '17:Rendezvous with the two-ship Falcon top-cover flight before entering the search corridor.',
    '18:Search Area Entry',
    '19:Begin armed reconnaissance. The reported convoy is moving and may be beyond the marked center.',
    '20:Egress Southwest',
    '21:End the attack, reform the package, and clear the Osan corridor to the southwest.',
    '22:Itazuke Exit',
    '23:Leave the Korea operational map here for the return flight to Itazuke.',
  ].join('\r\n') + '\r\n';
}

function encodeLocalization(text) {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
}

function writePackage(directory, missionText, englishText, sdsText = null) {
  fs.mkdirSync(directory, { recursive: true });
  const missionPath = path.join(directory, `${MISSION_NAME}.Mission`);
  const englishPath = path.join(directory, `${MISSION_NAME}.eng`);
  fs.writeFileSync(missionPath, missionText, 'utf8');
  fs.writeFileSync(englishPath, encodeLocalization(englishText));
  const result = { missionPath, englishPath };
  if (sdsText !== null) {
    result.sdsPath = path.join(directory, `${MISSION_NAME}.sds`);
    fs.writeFileSync(result.sdsPath, sdsText, 'utf8');
  }
  return result;
}

function metadata() {
  return { title: 'Black Scorpions 002 - Osan Road Hunt', aircraft: { player: 'f80c10' }, filters: { targetType: 'Ground Attack' } };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameMissions = path.resolve(args['game-missions'] || DEFAULT_GAME_MISSIONS);
  const sourcePath = path.resolve(args.source || path.join(gameMissions, 'F80_vs_Infantry_And_Armor_1.Mission'));
  if (!fs.existsSync(sourcePath)) throw new Error(`Source mission not found: ${sourcePath}`);
  const missionText = buildMission(fs.readFileSync(sourcePath, 'utf8'));
  const coopMissionText = buildCoopMissionText(missionText);
  const englishText = buildEnglishText();
  const generated = writePackage(path.join(REPO_ROOT, 'generated', MISSION_NAME), missionText, englishText);
  const game = writePackage(gameMissions, missionText, englishText);
  const gameData = path.dirname(gameMissions);
  const multiplayerRoot = path.join(gameData, 'Multiplayer');
  const coopRoot = path.join(multiplayerRoot, 'COOP');
  const preferredRoot = path.join(multiplayerRoot, 'Cooperative', MISSION_NAME);
  const generatedCoop = writePackage(path.join(REPO_ROOT, 'generated', `${MISSION_NAME}_COOP`), coopMissionText, englishText, buildCoopSdsText(metadata(), `Cooperative/${MISSION_NAME}/${MISSION_NAME}.Mission`));
  const cooperative = writePackage(preferredRoot, coopMissionText, englishText, buildCoopSdsText(metadata(), `Cooperative/${MISSION_NAME}/${MISSION_NAME}.Mission`));
  const coopCompatibility = writePackage(coopRoot, coopMissionText, englishText, buildCoopSdsText(metadata(), `${MISSION_NAME}.Mission`));
  const multiplayerCompatibility = writePackage(multiplayerRoot, coopMissionText, englishText, buildCoopSdsText(metadata(), `COOP/${MISSION_NAME}.Mission`));
  registerCoopMissionInLocalServerSetup([`Multiplayer/Cooperative/${MISSION_NAME}/${MISSION_NAME}`,`Multiplayer/${MISSION_NAME}`,`Multiplayer/COOP/${MISSION_NAME}`]);
  process.stdout.write(JSON.stringify({ sourcePath, singlePlayer: { generated, game }, coop: { generatedCoop, cooperative, coopCompatibility, multiplayerCompatibility } }, null, 2));
}

if (require.main === module) main();

module.exports = { buildMission, buildMissionLayer, buildEnglishText };
