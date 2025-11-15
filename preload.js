const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  receiveMessage: (callback) => {
    ipcRenderer.on('main-message', (event, data) => callback(data));
  },

  installedMessage: (callback) => {
    ipcRenderer.on('installedList', (event, data) => callback(data));
  },

  modifyMessage: (callback) => {
    ipcRenderer.on('currently-modifying-app', (event, data) => callback(data));
  },

  outdatedMessage: (callback) => {
    ipcRenderer.on('outdated-app', (event, data) => callback(data));
  },

  installedTextMessage: (callback) => {
    ipcRenderer.on('installedDisplay', (event, data) => callback(data));
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('main-message');
  },

  messageToMain: (message) => ipcRenderer.send('message-to-main', message)
});