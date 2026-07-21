const http = require('http');
const fs = require('fs');
const path = require('path');

const reports = {
  '/': path.resolve(__dirname, '..', 'reports', 'current-situation.html'),
  '/current-situation.html': path.resolve(__dirname, '..', 'reports', 'current-situation.html'),
  '/history': path.resolve(__dirname, '..', 'reports', 'historical-frontline.html'),
  '/historical-frontline.html': path.resolve(__dirname, '..', 'reports', 'historical-frontline.html'),
  '/campaign': path.resolve(__dirname, '..', 'reports', 'campaign-tracker.html'),
  '/campaign-tracker.html': path.resolve(__dirname, '..', 'reports', 'campaign-tracker.html')
};
const port = Number(process.env.SITUATION_REPORT_PORT || 4173);

if (!fs.existsSync(reports['/'])) {
  console.error('Situation report not found. Run npm run report:situation first.');
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const report = reports[request.url];
  if (!report) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  if (!fs.existsSync(report)) {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Report not built. Run npm run report:situation, npm run report:history, or npm run report:campaign.');
    return;
  }
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  fs.createReadStream(report).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Current situation: http://localhost:${port}/`);
  console.log(`Historical atlas:  http://localhost:${port}/history`);
  console.log(`Campaign tracker:  http://localhost:${port}/campaign`);
  console.log('Press Ctrl+C to stop.');
});
