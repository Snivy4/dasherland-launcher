const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const { Agent, setGlobalDispatcher } = require('undici');
const auth = require('./auth');
const { playNow } = require('./launcher');

// Minecraft's asset CDN starts dropping/timing out connections under the
// default high-concurrency undici agent; capping concurrent connections
// avoids most failures, and installer.js retries the remainder.
setGlobalDispatcher(new Agent({ connections: 16, connectTimeout: 30000, bodyTimeout: 60000, headersTimeout: 60000 }));

const configPath = path.join(__dirname, '..', '..', 'launcher.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('config:get', () => config);

ipcMain.handle('auth:loginSilent', () => auth.loginSilent());
ipcMain.handle('auth:login', async () => {
  try {
    const profile = await auth.login();
    console.log('[auth] login succeeded:', profile.name, profile.uuid);
    return profile;
  } catch (err) {
    console.error('[auth] login failed:', err);
    throw err;
  }
});
ipcMain.handle('auth:logout', () => auth.logout());

ipcMain.handle('game:play', async (event, authProfile) => {
  const send = (channel) => (message) => event.sender.send(channel, message);
  const proc = await playNow(config, authProfile, send('game:progress'), send('game:log'));
  proc.on('close', (code) => event.sender.send('game:exit', code));
  return true;
});
