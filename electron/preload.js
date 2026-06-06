const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getDataPath: () => ipcRenderer.invoke("get-data-path"),
  getUploadsPath: () => ipcRenderer.invoke("get-uploads-path"),
});