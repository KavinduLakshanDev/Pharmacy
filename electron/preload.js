const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  printReceipt: (data) => ipcRenderer.invoke("print-receipt", data),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  // Add other hardware features here as needed (barcode scanning, etc.)
});
