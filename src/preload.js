const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  resizePDFs: (filePaths, device) => ipcRenderer.invoke('resize-pdfs', filePaths, device),
  getUniqueFilePath: (filePath) => ipcRenderer.invoke('get-unique-file-path', filePath),
  onResetApplication: (callback) => {
    ipcRenderer.on('reset-application', callback);
  },
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, progress) => {
      callback(progress);
    });
  }
});