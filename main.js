const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Firebird = require('node-firebird');
const XLSX = require('xlsx');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Quitar el menú superior
  mainWindow.setMenu(null);

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configuración de Firebird
const dbOptions = {
  host: '127.0.0.1',
  port: 3050,
  database: 'C:/winfarma/data/winfarma',
  user: 'SYSDBA',
  password: '.',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

// Consulta de presupuestos
ipcMain.handle('get-presupuestos', async () => {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) {
        reject(err);
      }

      db.query('SELECT ID, USUARIO, FECHA FROM PRE_LISMAESTRO', (err, result) => {
        if (err) {
          db.detach();
          reject(err);
        }

        db.detach();
        resolve(result);
      });
    });
  });
});

// Consulta de detalles de presupuesto
ipcMain.handle('get-presupuesto-detalles', async (event, idPresupuesto) => {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) {
        reject(err);
      }

      db.query('SELECT * FROM PRE_LISDETALLE WHERE IDPRESUESTO = ?', [idPresupuesto], (err, result) => {
        if (err) {
          db.detach();
          reject(err);
        }

        db.detach();
        resolve(result);
      });
    });
  });
});

ipcMain.handle('exportar-presupuesto-detalles', async (event, detalles, idPresupuesto) => {

  // Filtrar las columnas específicas
  const columnasFiltradas = detalles.map(detalle => ({
    CANTIDAD: detalle.CANTIDAD,
    DESCRIPCION: detalle.DESCRIPCION,
    PRECIO: detalle.PRECIO,
    TOTRENGLON: detalle.TOTRENGLON
  }));

  console.log(idPresupuesto);

  // Crear un nuevo libro de Excel
  const wb = XLSX.utils.book_new();

  // Convertir los detalles filtrados en una hoja de Excel
  const ws = XLSX.utils.json_to_sheet(columnasFiltradas);

  // Calcular la suma total de la columna TOTRENGLON
  const total = columnasFiltradas.reduce((acc, curr) => acc + curr.TOTRENGLON, 0);

  // Obtener el número de la última fila (que será la fila para la suma)
  const ultimaFila = columnasFiltradas.length + 1; // +1 porque las filas empiezan en 1

  // Agregar la suma total al final de la columna TOTRENGLON
  ws[`D${ultimaFila + 1}`] = { t: 'n', v: total }; // Columna D (que corresponde a TOTRENGLON)

  // Etiqueta para la suma
  ws[`C${ultimaFila + 1}`] = { t: 's', v: 'Total:' }; // Columna C (antes de TOTRENGLON)

  // Ajustar el rango de la hoja
  const rango = XLSX.utils.decode_range(ws['!ref']);
  rango.e.r = ultimaFila; // Ajustar el final de la fila en el rango
  ws['!ref'] = XLSX.utils.encode_range(rango);

  // Agregar la hoja al libro de Excel
  XLSX.utils.book_append_sheet(wb, ws, 'Detalles');

  // Obtener la ruta para guardar el archivo
  const { filePath } = await dialog.showSaveDialog({
    title: 'Guardar archivo Excel',
    defaultPath: `Detalles_presupuesto_N°${idPresupuesto}.xlsx`,
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] }
    ]
  });

  if (filePath) {
    // Escribir el archivo en el sistema
    XLSX.writeFile(wb, filePath);
    return { success: true };
  } else {
    return { success: false };
  }
});