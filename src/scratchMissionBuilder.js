const lineBreak = '\r\n';

const defaultCountries = {
  'UN/US-aligned': [601, 602, 603],
  'DPRK/PRC/Soviet-aligned': [501, 502, 503],
};

const strikeTypePresets = {
  'Airfield Strike': {
    iconText: 'Attack the marked airfield target area.',
    routeAltitudes: [1600, 1750, 1400, 1200],
    targetRadius: 2800,
  },
  'Bridge Strike': {
    iconText: 'Destroy the marked bridge target.',
    routeAltitudes: [1300, 1450, 1100, 1000],
    targetRadius: 2200,
  },
  'Harbor Strike': {
    iconText: 'Strike the marked harbor target area.',
    routeAltitudes: [1700, 1850, 1500, 1300],
    targetRadius: 3000,
  },
  'Industrial Strike': {
    iconText: 'Bomb the marked industrial target area.',
    routeAltitudes: [1800, 1900, 1550, 1350],
    targetRadius: 2800,
  },
};

class MissionIndexAllocator {
  constructor(start = 4) {
    this.nextValue = start;
  }

  next() {
    const current = this.nextValue;
    this.nextValue += 1;
    return current;
  }
}

function formatScalar(value) {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return String(value);
    }

    return Number(value).toFixed(3);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  if (Array.isArray(value)) {
    return `[${value.join(',')}]`;
  }

  return String(value);
}

function renderEvents(events, indent) {
  if (!events || events.length === 0) {
    return null;
  }

  const lines = [`${indent}OnEvents`, `${indent}{`];
  events.forEach((event) => {
    lines.push(`${indent}  OnEvent`);
    lines.push(`${indent}  {`);
    lines.push(`${indent}    Type = ${event.type};`);
    lines.push(`${indent}    TarId = ${event.tarId};`);
    lines.push(`${indent}  }`);
  });
  lines.push(`${indent}}`);
  return lines.join(lineBreak);
}

function renderBlock(type, fields, events = null, indent = '  ') {
  const lines = [`${indent}${type}`, `${indent}{`];
  Object.entries(fields).forEach(([key, value]) => {
    lines.push(`${indent}  ${key} = ${formatScalar(value)};`);
  });

  const eventsBlock = renderEvents(events, `${indent}  `);
  if (eventsBlock) {
    lines.push('');
    lines.push(eventsBlock);
  }

  lines.push(`${indent}}`);
  return lines.join(lineBreak);
}

function normalizeMissionPath(value) {
  return String(value || '').replace(/\\\\/g, '\\');
}

function renderOptionsBlock(scenario, landscape, weather) {
  const friendlyCoalition = scenario.filters.friendlyFaction || 'UN/US-aligned';
  const enemyCoalition = scenario.filters.enemyFaction || 'DPRK/PRC/Soviet-aligned';
  const friendlyCountries = defaultCountries[friendlyCoalition] || [601];
  const enemyCountries = defaultCountries[enemyCoalition] || [501];
  const countries = [0, ...enemyCountries, ...friendlyCountries.filter((value) => !enemyCountries.includes(value))];

  const countryLines = countries.map((country) => {
    if (country === 0) {
      return '    0 : 0;';
    }

    return `    ${country} : ${enemyCountries.includes(country) ? 1 : 2};`;
  });

  return [
    'Options',
    '{',
    '  LCName = 0;',
    '  LCDesc = 1;',
    '  LCAuthor = 2;',
    `  PlayerConfig = "LuaScripts\\WorldObjects\\Planes\\${scenario.aircraft.player}.txt";`,
    `  Time = ${scenario.environment.startTime};`,
    `  Date = ${landscape.date};`,
    `  HMap = "${normalizeMissionPath(landscape.hmap)}";`,
    `  Textures = "${normalizeMissionPath(landscape.textures)}";`,
    `  Forests = "${normalizeMissionPath(landscape.forests)}";`,
    '  Layers = "";',
    `  GuiMap = "${landscape.guimap}";`,
    `  SeasonPrefix = "${landscape.season_prefix}";`,
    '  MissionType = 0;',
    '  AqmId = 0;',
    `  CloudLevel = ${weather.cloudLevel};`,
    `  CloudHeight = ${weather.cloudHeight};`,
    `  PrecLevel = ${weather.precLevel};`,
    `  PrecType = ${weather.precType};`,
    `  CloudConfig = "${weather.cloudConfig}";`,
    '  SeaState = 0;',
    '  Turbulence = 0;',
    `  TempPressLevel = ${landscape.temperature > 0 ? 25 : 0};`,
    `  Temperature = ${landscape.temperature};`,
    '  Pressure = 750;',
    `  Haze = ${weather.haze};`,
    `  LayerFog = ${weather.layerFog};`,
    '  CloudsShift = 0.2;',
    '  WindLayers',
    '  {',
    '    0 :     100 :     2;',
    '    500 :     110 :     3;',
    '    1000 :     120 :     5;',
    '    2000 :     130 :     10;',
    '    5000 :     140 :     20;',
    '  }',
    '  Countries',
    '  {',
    ...countryLines,
    '  }',
    '}',
  ].join(lineBreak);
}

function getStrikePreset(targetType) {
  return strikeTypePresets[targetType] || strikeTypePresets['Industrial Strike'];
}

function buildRoutePoints(startAirfield, targetArea, preset) {
  const startPosition = startAirfield?.position || { x: targetArea.x - 28000, z: targetArea.z + 24000 };
  const ingress = {
    x: targetArea.x - 16000,
    z: targetArea.z + 12000,
    y: preset.routeAltitudes[0],
  };
  const initial = {
    x: startPosition.x + (ingress.x - startPosition.x) * 0.35,
    z: startPosition.z + (ingress.z - startPosition.z) * 0.35,
    y: preset.routeAltitudes[0],
  };
  const target = {
    x: targetArea.x,
    z: targetArea.z,
    y: preset.routeAltitudes[2],
  };
  const egress = {
    x: targetArea.x + 18000,
    z: targetArea.z - 11000,
    y: preset.routeAltitudes[3],
  };

  return [
    { x: startPosition.x, z: startPosition.z, y: preset.routeAltitudes[0] - 250 },
    initial,
    ingress,
    target,
    egress,
  ];
}

function buildEscortRoutePoints(routePoints, altitudeOffset = 250) {
  return routePoints.map((point, index) => ({
    x: point.x + (index % 2 === 0 ? -420 : -260),
    z: point.z + (index % 2 === 0 ? 340 : 220),
    y: point.y + altitudeOffset,
  }));
}

function getTargetPlacementPattern(targetType, count) {
  const patterns = {
    'Bridge Strike': [
      { x: -140, z: -30, yaw: 92 },
      { x: 140, z: 35, yaw: 92 },
      { x: 0, z: 180, yaw: 10 },
    ],
    'Airfield Strike': [
      { x: -320, z: -180, yaw: 0 },
      { x: 0, z: 40, yaw: 24 },
      { x: 320, z: 180, yaw: 0 },
      { x: -120, z: 240, yaw: 70 },
    ],
    'Harbor Strike': [
      { x: -360, z: -220, yaw: 28 },
      { x: -40, z: 30, yaw: 44 },
      { x: 300, z: 220, yaw: 66 },
      { x: 120, z: -180, yaw: 14 },
    ],
    'Industrial Strike': [
      { x: -260, z: -160, yaw: 0 },
      { x: 20, z: -20, yaw: 90 },
      { x: 280, z: 150, yaw: 0 },
      { x: -80, z: 240, yaw: 90 },
    ],
  };

  const selected = patterns[targetType] || patterns['Industrial Strike'];
  return Array.from({ length: count }, (_, index) => selected[index % selected.length]);
}

function buildTargetBlocks({ allocator, scenario, targetArea, enemyCountry }) {
  const placements = getTargetPlacementPattern(scenario.filters.targetType, scenario.targets.length);

  return scenario.targets.map((target, index) =>
    renderBlock('Block', {
      Name: '"Block"',
      Index: allocator.next(),
      LinkTrId: 0,
      XPos: targetArea.x + placements[index].x,
      YPos: targetArea.y,
      ZPos: targetArea.z + placements[index].z,
      XOri: 0,
      YOri: placements[index].yaw,
      ZOri: 0,
      Model: `"${target.modelPath}"`,
      Script: `"${target.scriptPath}"`,
      Country: enemyCountry,
      Desc: '""',
      DamageReport: 50,
      DamageThreshold: 1,
      DeleteAfterDeath: 1,
      PinToTerrain: 1,
      Flags: 0,
    })
  );
}

function buildEscortFlight({ allocator, supportAircraft, routePoints, playerCountry }) {
  if (!supportAircraft) {
    return [];
  }

  const escortRoutePoints = buildEscortRoutePoints(routePoints);
  const escortLeaderPlaneIndex = allocator.next();
  const escortLeaderEntityIndex = allocator.next();
  const escortWingmanPlaneIndex = allocator.next();
  const escortWingmanEntityIndex = allocator.next();
  const escortBeginIndex = allocator.next();
  const escortTimerIndex = allocator.next();
  const escortWaypointIndexes = escortRoutePoints.slice(1).map(() => allocator.next());
  const escortBlocks = [];

  escortBlocks.push(
    renderBlock('Plane', {
      Name: '"Escort Leader"',
      Index: escortLeaderPlaneIndex,
      LinkTrId: escortLeaderEntityIndex,
      XPos: escortRoutePoints[0].x,
      YPos: escortRoutePoints[0].y,
      ZPos: escortRoutePoints[0].z,
      XOri: 0,
      YOri: 180,
      ZOri: 0,
      Script: `"LuaScripts\\WorldObjects\\Planes\\${supportAircraft}.txt"`,
      Model: `"graphics\\planes\\${supportAircraft}\\${supportAircraft}.mgm"`,
      Country: playerCountry,
      Desc: '""',
      Skin: '""',
      BotSkin: '""',
      AILevel: 1,
      CoopStart: 0,
      NumberInFormation: 0,
      Vulnerable: 1,
      Engageable: 1,
      LimitAmmo: 1,
      StartType: 0,
      Callsign: 3,
      Callnum: 1,
      DamageReport: 50,
      DamageThreshold: 1,
      PayloadId: 0,
      ModMask: 0,
      AiRTBDecision: 0,
      DeleteAfterDeath: 1,
      DeleteAfterLand: 1,
      Spotter: -1,
      Fuel: 0.8,
      TCode: '""',
      TCodeColor: '""',
      GunLoad: [],
      GunBelt: [],
      VictoryCount: 0,
      Emblem: 0,
    })
  );

  escortBlocks.push(
    renderBlock('MCU_TR_Entity', {
      Index: escortLeaderEntityIndex,
      Name: '"Escort Leader entity"',
      Desc: '""',
      Targets: [],
      Objects: [],
      XPos: escortRoutePoints[0].x,
      YPos: escortRoutePoints[0].y + 0.2,
      ZPos: escortRoutePoints[0].z,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Enabled: 0,
      MisObjID: escortLeaderPlaneIndex,
    })
  );

  escortBlocks.push(
    renderBlock('Plane', {
      Name: '"Escort Wingman"',
      Index: escortWingmanPlaneIndex,
      LinkTrId: escortWingmanEntityIndex,
      XPos: escortRoutePoints[0].x + 110,
      YPos: escortRoutePoints[0].y,
      ZPos: escortRoutePoints[0].z - 90,
      XOri: 0,
      YOri: 180,
      ZOri: 0,
      Script: `"LuaScripts\\WorldObjects\\Planes\\${supportAircraft}.txt"`,
      Model: `"graphics\\planes\\${supportAircraft}\\${supportAircraft}.mgm"`,
      Country: playerCountry,
      Desc: '""',
      Skin: '""',
      BotSkin: '""',
      AILevel: 1,
      CoopStart: 0,
      NumberInFormation: 1,
      Vulnerable: 1,
      Engageable: 1,
      LimitAmmo: 1,
      StartType: 0,
      Callsign: 3,
      Callnum: 2,
      DamageReport: 50,
      DamageThreshold: 1,
      PayloadId: 0,
      ModMask: 0,
      AiRTBDecision: 0,
      DeleteAfterDeath: 1,
      DeleteAfterLand: 1,
      Spotter: -1,
      Fuel: 0.8,
      TCode: '""',
      TCodeColor: '""',
      GunLoad: [],
      GunBelt: [],
      VictoryCount: 0,
      Emblem: 0,
    })
  );

  escortBlocks.push(
    renderBlock('MCU_TR_Entity', {
      Index: escortWingmanEntityIndex,
      Name: '"Escort Wingman entity"',
      Desc: '""',
      Targets: [escortLeaderEntityIndex],
      Objects: [],
      XPos: escortRoutePoints[0].x + 110,
      YPos: escortRoutePoints[0].y + 0.2,
      ZPos: escortRoutePoints[0].z - 90,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Enabled: 0,
      MisObjID: escortWingmanPlaneIndex,
    })
  );

  escortRoutePoints.slice(1).forEach((point, index) => {
    const nextWaypointIndex = escortWaypointIndexes[index + 1];
    escortBlocks.push(
      renderBlock('MCU_Waypoint', {
        Index: escortWaypointIndexes[index],
        Name: `"Escort Route ${index + 1}"`,
        Desc: '""',
        Targets: nextWaypointIndex ? [nextWaypointIndex] : [],
        Objects: index === 0 ? [escortLeaderEntityIndex, escortWingmanEntityIndex] : [],
        XPos: point.x,
        YPos: point.y,
        ZPos: point.z,
        XOri: 0,
        YOri: 180,
        ZOri: 0,
        TransformParentID: -1,
        Area: 2400,
        Speed: 420,
        Priority: 1,
      })
    );
  });

  escortBlocks.push(
    renderBlock('MCU_TR_MissionBegin', {
      Index: escortBeginIndex,
      Name: '"Escort Mission Begin"',
      Desc: '""',
      Targets: [escortTimerIndex],
      Objects: [],
      XPos: escortRoutePoints[0].x - 80,
      YPos: escortRoutePoints[0].y,
      ZPos: escortRoutePoints[0].z,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Enabled: 1,
    })
  );

  escortBlocks.push(
    renderBlock('MCU_Timer', {
      Index: escortTimerIndex,
      Name: '"Escort Startup Delay"',
      Desc: '""',
      Targets: [escortLeaderEntityIndex, escortWingmanEntityIndex, escortWaypointIndexes[0]],
      Objects: [],
      XPos: escortRoutePoints[0].x - 65,
      YPos: escortRoutePoints[0].y,
      ZPos: escortRoutePoints[0].z,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Time: 3,
      Random: 100,
    })
  );

  return escortBlocks;
}

function buildScratchMissionText({ scenario, landscape, weather, enemyCountry, playerCountry }) {
  const allocator = new MissionIndexAllocator();
  const preset = getStrikePreset(scenario.filters.targetType);
  const targetArea = scenario.environment.targetArea;
  const routePoints = buildRoutePoints(scenario.startAirfield, targetArea, preset);
  const blocks = [];

  const leaderPlaneIndex = allocator.next();
  const leaderEntityIndex = allocator.next();
  const wingmanPlaneIndex = allocator.next();
  const wingmanEntityIndex = allocator.next();
  const missionBeginIndex = allocator.next();
  const startupTimerIndex = allocator.next();
  const objectiveIndex = allocator.next();
  const waypointIndexes = routePoints.slice(1).map(() => allocator.next());

  blocks.push(
    renderBlock('Plane', {
      Name: '"Player Leader"',
      Index: leaderPlaneIndex,
      LinkTrId: leaderEntityIndex,
      XPos: routePoints[0].x,
      YPos: routePoints[0].y,
      ZPos: routePoints[0].z,
      XOri: 0,
      YOri: 180,
      ZOri: 0,
      Script: `"LuaScripts\\WorldObjects\\Planes\\${scenario.aircraft.player}.txt"`,
      Model: `"graphics\\planes\\${scenario.aircraft.player}\\${scenario.aircraft.player}.mgm"`,
      Country: playerCountry,
      Desc: '""',
      Skin: '""',
      BotSkin: '""',
      AILevel: 0,
      CoopStart: 0,
      NumberInFormation: 0,
      Vulnerable: 1,
      Engageable: 1,
      LimitAmmo: 1,
      StartType: 0,
      Callsign: 7,
      Callnum: 1,
      DamageReport: 50,
      DamageThreshold: 1,
      PayloadId: 0,
      ModMask: 0,
      AiRTBDecision: 0,
      DeleteAfterDeath: 0,
      DeleteAfterLand: 0,
      Spotter: -1,
      Fuel: 0.85,
      TCode: '""',
      TCodeColor: '""',
      GunLoad: [],
      GunBelt: [],
      VictoryCount: 0,
      Emblem: 0,
    })
  );

  blocks.push(
    renderBlock(
      'MCU_TR_Entity',
      {
        Index: leaderEntityIndex,
        Name: '"Player Leader entity"',
        Desc: '""',
        Targets: [],
        Objects: [],
        XPos: routePoints[0].x,
        YPos: routePoints[0].y + 0.2,
        ZPos: routePoints[0].z,
        XOri: 0,
        YOri: 0,
        ZOri: 0,
      TransformParentID: -1,
      Enabled: 0,
      MisObjID: leaderPlaneIndex,
      },
      [{ type: 13, tarId: objectiveIndex }]
    )
  );

  blocks.push(
    renderBlock('Plane', {
      Name: '"Player Wingman"',
      Index: wingmanPlaneIndex,
      LinkTrId: wingmanEntityIndex,
      XPos: routePoints[0].x + 90,
      YPos: routePoints[0].y,
      ZPos: routePoints[0].z - 75,
      XOri: 0,
      YOri: 180,
      ZOri: 0,
      Script: `"LuaScripts\\WorldObjects\\Planes\\${scenario.aircraft.player}.txt"`,
      Model: `"graphics\\planes\\${scenario.aircraft.player}\\${scenario.aircraft.player}.mgm"`,
      Country: playerCountry,
      Desc: '""',
      Skin: '""',
      BotSkin: '""',
      AILevel: 1,
      CoopStart: 0,
      NumberInFormation: 1,
      Vulnerable: 1,
      Engageable: 1,
      LimitAmmo: 1,
      StartType: 0,
      Callsign: 7,
      Callnum: 2,
      DamageReport: 50,
      DamageThreshold: 1,
      PayloadId: 0,
      ModMask: 0,
      AiRTBDecision: 0,
      DeleteAfterDeath: 1,
      DeleteAfterLand: 1,
      Spotter: -1,
      Fuel: 0.85,
      TCode: '""',
      TCodeColor: '""',
      GunLoad: [],
      GunBelt: [],
      VictoryCount: 0,
      Emblem: 0,
    })
  );

  blocks.push(
    renderBlock('MCU_TR_Entity', {
      Index: wingmanEntityIndex,
      Name: '"Player Wingman entity"',
      Desc: '""',
      Targets: [leaderEntityIndex],
      Objects: [],
      XPos: routePoints[0].x + 90,
      YPos: routePoints[0].y + 0.2,
      ZPos: routePoints[0].z - 75,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Enabled: 0,
      MisObjID: wingmanPlaneIndex,
    })
  );

  routePoints.slice(1).forEach((point, index) => {
    const nextWaypointIndex = waypointIndexes[index + 1];
    blocks.push(
      renderBlock('MCU_Waypoint', {
        Index: waypointIndexes[index],
        Name: `"Route ${index + 1}"`,
        Desc: '""',
        Targets: nextWaypointIndex ? [nextWaypointIndex] : [],
        Objects: index === 0 ? [leaderEntityIndex, wingmanEntityIndex] : [],
        XPos: point.x,
        YPos: point.y,
        ZPos: point.z,
        XOri: 0,
        YOri: 180,
        ZOri: 0,
        TransformParentID: -1,
        Area: preset.targetRadius,
        Speed: 380,
        Priority: index === routePoints.length - 2 ? 0 : 1,
      })
    );
  });

  blocks.push(...buildTargetBlocks({ allocator, scenario, targetArea, enemyCountry }));
  blocks.push(...buildEscortFlight({
    allocator,
    supportAircraft: scenario.supportAircraft,
    routePoints,
    playerCountry,
  }));

  blocks.push(
    renderBlock(
      'MCU_TR_MissionBegin',
      {
        Index: missionBeginIndex,
        Name: '"Mission Begin"',
        Desc: '""',
        Targets: [startupTimerIndex],
        Objects: [],
        XPos: routePoints[0].x - 120,
        YPos: routePoints[0].y,
        ZPos: routePoints[0].z,
        XOri: 0,
        YOri: 0,
        ZOri: 0,
        TransformParentID: -1,
        Enabled: 1,
      }
    )
  );

  blocks.push(
    renderBlock('MCU_Timer', {
      Index: startupTimerIndex,
      Name: '"Startup Delay"',
      Desc: '""',
      Targets: [leaderEntityIndex, wingmanEntityIndex, waypointIndexes[0]],
      Objects: [],
      XPos: routePoints[0].x - 105,
      YPos: routePoints[0].y,
      ZPos: routePoints[0].z,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Time: 2,
      Random: 100,
    })
  );

  blocks.push(
    renderBlock('MCU_TR_MissionObjective', {
      Index: objectiveIndex,
      Targets: [],
      Objects: [],
      XPos: targetArea.x,
      YPos: targetArea.y + 50,
      ZPos: targetArea.z,
      XOri: 0,
      YOri: 0,
      ZOri: 0,
      TransformParentID: -1,
      Enabled: 1,
      LCName: 23,
      LCDesc: 24,
      TaskType: 0,
      Coalition: 2,
      Success: 1,
      IconType: 102,
    })
  );

  return [
    '# Mission File Version = 1.0;',
    '',
    renderOptionsBlock(scenario, landscape, weather),
    '',
    'Group',
    '{',
    '  Name = "MISSION";',
    '  Index = 3;',
    '  Desc = "";',
    blocks.join(`${lineBreak}${lineBreak}`),
    '}',
    '',
  ].join(lineBreak);
}

function buildScratchLocalizationText(scenario, buildObjectiveText) {
  const title = `Scenario - ${scenario.title}`;
  const briefing = buildObjectiveText(scenario, null, scenario.targets || []);
  const lineMap = new Map();
  for (let index = 0; index <= 24; index += 1) {
    lineMap.set(index, '');
  }

  lineMap.set(0, title);
  lineMap.set(1, briefing);
  lineMap.set(2, 'Codex');
  lineMap.set(23, scenario.filters.targetType);
  lineMap.set(24, scenario.filters.targetType);
  lineMap.set(210, 'Proceed to the marked objective and attack the target area.');
  lineMap.set(211, 'Target location is marked on the map.');
  lineMap.set(212, 'Attack the marked objective.');
  lineMap.set(218, 'Return to base after completing the attack.');
  lineMap.set(219, 'Proceed with landing approach.');
  lineMap.set(220, 'Taxi to the parking area.');

  const lines = [...lineMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([index, value]) => `${index}:${value}`);

  return `${lines.join(lineBreak)}${lineBreak}`;
}

module.exports = {
  buildScratchMissionText,
  buildScratchLocalizationText,
};
