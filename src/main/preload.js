const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  loginSilent: () => ipcRenderer.invoke('auth:loginSilent'),
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  play: (authProfile) => ipcRenderer.invoke('game:play', authProfile),
  onProgress: (cb) => ipcRenderer.on('game:progress', (_e, message) => cb(message)),
  onLog: (cb) => ipcRenderer.on('game:log', (_e, line) => cb(line)),
  onExit: (cb) => ipcRenderer.on('game:exit', (_e, code) => cb(code)),
});
