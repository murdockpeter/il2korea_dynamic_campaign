const fs = require('fs');
const path = require('path');

function validate(key) {
  if (key && !/^[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('GOOGLE_MAPS_API_KEY contains unexpected characters.');
  }
  return key;
}

function readLocalGoogleMapsKey(root) {
  const environmentKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (environmentKey) return { key: validate(environmentKey), source: 'environment' };

  const localReports = [
    'campaign-tracker.html',
    'current-situation.html',
    'historical-frontline.html'
  ];

  for (const filename of localReports) {
    const report = path.join(root, 'reports', filename);
    if (!fs.existsSync(report)) continue;
    const html = fs.readFileSync(report, 'utf8');
    const match = html.match(/const GOOGLE_MAPS_API_KEY="([A-Za-z0-9_-]+)";/);
    if (match) return { key: validate(match[1]), source: `ignored local report ${filename}` };
  }

  return { key: '', source: 'none' };
}

module.exports = { readLocalGoogleMapsKey };
