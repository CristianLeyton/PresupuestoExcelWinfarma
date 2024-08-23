window.addEventListener('DOMContentLoaded', async () => {
  let presupuestos = await window.api.getPresupuestos();
  const tableBody = document.querySelector('#presupuestos-table tbody');


  // Obtener la fecha actual en formato YYYY-MM-DD
  const today = obtenerFechaLocal();

  // Establecer la fecha actual en los campos de fecha
  document.querySelector('#start-date').value = today;
  document.querySelector('#end-date').value = today;

  // Filtrar los presupuestos por la fecha actual
  const presupuestosFiltrados = presupuestos.filter(presupuesto => {
    const fechaPresupuesto = normalizarFecha(new Date(presupuesto.FECHA));
    return fechaPresupuesto === today;
  });

  // Mostrar los presupuestos filtrados por la fecha de hoy
  mostrarPresupuestos(presupuestosFiltrados);

  // Manejar el filtro por fecha cuando el usuario lo aplica manualmente
  document.querySelector('#filter-btn').addEventListener('click', async () => {
    try {
      // Obtener presupuestos actualizados desde la base de datos
      if (document.querySelector('#end-date').value == today) {
        presupuestos = await window.api.getPresupuestos();
        console.log('Actualiza la consulta de los presupuestos')
      }
  
      const startDate = document.querySelector('#start-date').value;
      const endDate = document.querySelector('#end-date').value;
  
      // Convertir a Date y normalizar para poder comparar
      const start = normalizarFechaUTC(new Date(startDate));
      const end = normalizarFechaUTC(new Date(endDate));
  
      // Filtrar presupuestos por rango de fechas
      const presupuestosFiltrados = presupuestos.filter(presupuesto => {
        const fechaPresupuesto = normalizarFecha(presupuesto.FECHA);
        return fechaPresupuesto >= start && fechaPresupuesto <= end;
      });
  
      // Mostrar presupuestos filtrados
      mostrarPresupuestos(presupuestosFiltrados);
    } catch (error) {
      console.error('Error al obtener los presupuestos:', error);
    }
  });
});

function obtenerFechaLocal() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`; // Formato YYYY-MM-DD
}

function normalizarFechaUTC(fecha) {
  // Convertir la fecha a su equivalente en UTC (evitando desplazamiento de zona horaria)
  const año = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
  const dia = String(fecha.getUTCDate()).padStart(2, '0');

  return `${año}-${mes}-${dia}`; // Formato YYYY-MM-DD
}

function normalizarFecha(fecha) {
  // Mantener la fecha en la zona horaria local sin convertirla a UTC
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${año}-${mes}-${dia}`; // Formato YYYY-MM-DD
}

function formatearFecha(fecha) {
  const opciones = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Formato de 24 horas
  };
  return new Date(fecha).toLocaleString('es-ES', opciones).replace(',', ' -');
}

// Mostrar presupuestos en la tabla con formato de fecha personalizado
function mostrarPresupuestos(presupuestos) {
  const tableBody = document.querySelector('#presupuestos-table tbody');
  tableBody.innerHTML = ''; // Limpiar la tabla antes de mostrar los datos

  presupuestos.forEach(presupuesto => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${presupuesto.ID}</td>
      <td>${presupuesto.USUARIO}</td>
      <td>${formatearFecha(presupuesto.FECHA)}hs</td>
      <td><button class="bg-indigo-500 text-center py-1 px-2 text-sm text-white font-semibold rounded active:scale-95" onclick="verDetalles(${presupuesto.ID})">Ver</button></td>
    `;
    tableBody.appendChild(row);
  });
}
  
  async function verDetalles(idPresupuesto) {
    const detalles = await window.api.getPresupuestoDetalles(idPresupuesto);
    const detallesTableBody = document.querySelector('#detalles-table tbody');
    const presupuestoNum = document.querySelector('#presupuestoNum');
    document.querySelector('#exportar-btn').classList.remove('disabled');
    const totalPresupuesto = document.querySelector('#totalPresupuesto')
    let sumaPresupuesto = 0;

    presupuestoNum.textContent = idPresupuesto;
    // Limpiar tabla de detalles
    detallesTableBody.innerHTML = '';
  
    detalles.forEach(detalle => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class='text-center'>${detalle.CANTIDAD}</td>
        <td >${detalle.DESCRIPCION}</td>
        <td>${detalle.PRECIO.toFixed(2)}</td>
        <td>${detalle.TOTRENGLON.toFixed(2)}</td>
      `;
      sumaPresupuesto += detalle.TOTRENGLON;
      detallesTableBody.appendChild(row);
    });

    totalPresupuesto.textContent = sumaPresupuesto.toFixed(2);     
    // Habilitar el botón de exportación
    document.querySelector('#exportar-btn').onclick = () => exportarDetalles(detalles, idPresupuesto);
}

async function exportarDetalles(detalles, idPresupuesto) {

  const result = await window.api.exportarDetalles(detalles, idPresupuesto);
  if (result.success) {
    alert('Detalles exportados exitosamente');
  } else {
    alert('Exportación cancelada');
  }
}
