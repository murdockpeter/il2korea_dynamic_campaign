const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { buildOptions, buildScenario } = require('./generator');

function createWindow() {
  const window = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 900,
    minHeight: 680,
    backgroundColor: '#d8d0c2',
    icon: path.join(__dirname, 'images', 'app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('catalog:get-options', async () => buildOptions());
  ipcMain.handle('scenario:generate', async (_event, input) => buildScenario(input));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
