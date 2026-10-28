// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const medicos = [
  { id: 1, nombre: 'Dr. Juan Pérez', registro_medico: '1001234567', especialidad: 'Cardiología', sede: 'Bogotá' },
  { id: 2, nombre: 'Dr. How', registro_medico: '1007654321', especialidad: 'Neurología', sede: 'Cali'},
  { id: 3, nombre: 'Dr. Strange', registro_medico: '1009876543', especialidad: 'Pediatría', sede: 'Medellín'},
];
let siguienteId = 4;

async function findAll() {
  return medicos;
}

async function findById(id) {
  return medicos.find((u) => u.id === id) || null;
}

async function findByRegistroMedico(registro_medico) {
  return medicos.find((m) => m.registro_medico === registro_medico) || null;
}

async function create(medico) {
  const nuevo = { id: siguienteId++, ...medico };
  medicos.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, findByRegistroMedico, create };
