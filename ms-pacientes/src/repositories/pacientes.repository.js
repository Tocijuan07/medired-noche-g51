// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const pacientes = [
  { id: 1, nombre: 'Oscar Jimenez', documento: '1001234567', fecha_nacimiento: '2004-10-28', eps: 'comfenalco' , telefono: '3154414635' },
  { id: 2, nombre: 'Ilana Urrea', documento: '1007654321', fecha_nacimiento: '2006-05-09', eps: 'comfandi' , telefono:'3053124241' },
  { id: 3, nombre: 'Juan Damigo', documento: '1009876543', fecha_nacimiento: '2005-07-09', eps: 'sura', telefono:'3193378512'},
];
let siguienteId = 4;

async function findAll(filtros = {}) {
  return pacientes.filter((p) =>
    (!filtros.eps || p.eps.toLowerCase() === String(filtros.eps).toLowerCase()) &&
    (!filtros.ids || filtros.ids.includes(p.id))
  );
}

async function findById(id) {
  return pacientes.find((u) => u.id === id) || null;
}

async function findByDocumento(documento) {
  return pacientes.find((p) => p.documento === documento) || null;
}

async function create(paciente) {
  const nuevo = { id: siguienteId++, ...paciente };
  pacientes.push(nuevo);
  return nuevo;
}

async function actualizar(id, paciente) {
  const posicion = pacientes.findIndex((u) => u.id === id);
  if (posicion === -1) {
    return null;
  }
  pacientes[posicion] = { id, ...paciente };
  return pacientes[posicion];
}

async function eliminar(id) {
  const posicion = pacientes.findIndex((u) => u.id === id);
  if (posicion === -1) return false;
  pacientes.splice(posicion, 1);
    return true;
  }

module.exports = { findAll, findById, findByDocumento, create, actualizar, eliminar };
