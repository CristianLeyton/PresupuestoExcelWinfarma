const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getPresupuestos: () => ipcRenderer.invoke('get-presupuestos'),
  getPresupuestoDetalles: (idPresupuesto) => ipcRenderer.invoke('get-presupuesto-detalles', idPresupuesto),
  exportarDetalles: (detalles, idPresupuesto) => ipcRenderer.invoke('exportar-presupuesto-detalles', detalles, idPresupuesto)
});