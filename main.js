const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('node:path');

let windows = [];

function createWall() {
  const displays = screen.getAllDisplays();
  windows.forEach((window) => window.close());
  windows = displays.map((display, monitorIndex) => {
    const window = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      fullscreen: true,
      backgroundColor: '#080d18',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        sandbox: true,
        additionalArguments: [`--monitor-index=${monitorIndex}`, `--monitor-count=${displays.length}`]
      }
    });
    window.loadFile('index.html');
    return window;
  });
}

app.whenReady().then(() => {
  createWall();
  screen.on('display-added', createWall);
  screen.on('display-removed', createWall);
  screen.on('display-metrics-changed', createWall);
});

ipcMain.on('broadcast-settings', (_event, settings) => {
  windows.forEach((window) => window.webContents.send('settings-updated', settings));
});

ipcMain.on('exit-wall', () => app.quit());

app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => { if (!windows.length) createWall(); });
