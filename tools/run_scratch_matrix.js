const path = require('path');

process.env.IL2_KOREA_SCRATCH_BUILDER = '1';

const { buildScenario } = require(path.resolve(__dirname, '..', 'src', 'generator.js'));

const cases = [
  {
    aircraft: 'f51d',
    targetType: 'Airfield Strike',
    landscape: 'LANDSCAPE_Korea_au',
    enemyFaction: 'DPRK/PRC/Soviet-aligned',
    weather: 'Clear',
    startTime: '08:00:0',
    startAirfield: 'kimpo',
    coopFriendly: false,
  },
  {
    aircraft: 'il10',
    targetType: 'Bridge Strike',
    landscape: 'LANDSCAPE_Korea_au',
    enemyFaction: 'UN/US-aligned',
    weather: 'Clear',
    startTime: '12:00:0',
    startAirfield: 'auto',
    coopFriendly: false,
  },
  {
    aircraft: 'f84e',
    targetType: 'Harbor Strike',
    landscape: 'LANDSCAPE_Korea_sw',
    enemyFaction: 'DPRK/PRC/Soviet-aligned',
    weather: 'Broken Cloud',
    startTime: '08:00:0',
    startAirfield: 'seoul',
    coopFriendly: false,
  },
  {
    aircraft: 'la11',
    targetType: 'Industrial Strike',
    landscape: 'LANDSCAPE_Korea_sp',
    enemyFaction: 'UN/US-aligned',
    weather: 'Poor Visibility',
    startTime: '15:00:0',
    startAirfield: 'antung',
    coopFriendly: false,
  },
];

const results = cases.map((input) => {
  const result = buildScenario(input, { exportToGame: false });
  return {
    title: result.scenario.title,
    missionFamily: result.scenario.missionFamily?.label || null,
    supportAircraft: result.scenario.supportAircraft || null,
    missionOutputPath: result.missionOutputPath,
    targets: result.scenario.targets.map((target) => ({
      displayName: target.displayName,
      scriptPath: target.scriptPath,
    })),
  };
});

console.log(JSON.stringify(results, null, 2));
