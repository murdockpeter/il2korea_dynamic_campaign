const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { buildOptions, buildScenario, setInstallRootOverride } = require('./generator');

const settingsFileName = 'settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), settingsFileName);
}

function loadSettings() {
  try {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    return {};
  }
}

function saveSettings(settings) {
  const settingsPath = getSettingsPath();
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

function applySavedInstallOverride() {
  const settings = loadSettings();
  setInstallRootOverride(settings.installOverridePath || null);
}

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
  applySavedInstallOverride();
  ipcMain.handle('catalog:get-options', async () => buildOptions());
  ipcMain.handle('scenario:generate', async (_event, input) => buildScenario(input));
  ipcMain.handle('catalog:browse-install-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select IL-2 Korea install root or game folder',
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    return result.filePaths[0];
  });
  ipcMain.handle('catalog:set-install-dir', async (_event, installDir) => {
    const nextPath = installDir ? path.resolve(installDir) : null;
    const settings = loadSettings();
    settings.installOverridePath = nextPath;
    saveSettings(settings);
    setInstallRootOverride(nextPath);
    return buildOptions();
  });

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
