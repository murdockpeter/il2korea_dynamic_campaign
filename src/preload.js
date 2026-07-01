const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scenarioApp', {
  getOptions: () => ipcRenderer.invoke('catalog:get-options'),
  browseInstallDir: () => ipcRenderer.invoke('catalog:browse-install-dir'),
  setInstallDir: (installDir) => ipcRenderer.invoke('catalog:set-install-dir', installDir),
  generateScenario: (input) => ipcRenderer.invoke('scenario:generate', input),
});
