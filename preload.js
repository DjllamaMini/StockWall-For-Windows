const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tickerWall', {
  monitorIndex: Number(process.argv.find((value) => value.startsWith('--monitor-index='))?.split('=')[1] || 0),
  monitorCount: Number(process.argv.find((value) => value.startsWith('--monitor-count='))?.split('=')[1] || 1),
  saveSettings: (settings) => ipcRenderer.send('broadcast-settings', settings),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, settings) => callback(settings)),
  exit: () => ipcRenderer.send('exit-wall')
});
