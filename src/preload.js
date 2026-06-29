const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scenarioApp', {
  getOptions: () => ipcRenderer.invoke('catalog:get-options'),
  generateScenario: (input) => ipcRenderer.invoke('scenario:generate', input),
});
