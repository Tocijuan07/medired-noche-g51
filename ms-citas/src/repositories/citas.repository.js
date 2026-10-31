// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const citas = [
  { id: 1, paciente_id: 1, medico_id: 1, fecha_hora: '2026-11-10T09:00', sede: 'Bogotá', estado: 'programada' },
  { id: 2, paciente_id: 2, medico_id: 2, fecha_hora: '2026-11-10T10:30', sede: 'Cali', estado: 'atendida' },
  { id: 3, paciente_id: 3, medico_id: 3, fecha_hora: '2026-11-11T14:00', sede: 'Medellín', estado: 'cancelada' },
];
let siguienteId = 4;

async function findAll() {
  return citas;
}

async function findById(id) {
  return citas.find((c) => c.id === id) || null;
}

async function findByMedicoYFechaHora(medico_id, fecha_hora) {
  return citas.find((c) => c.medico_id === medico_id && c.fecha_hora === fecha_hora) || null;
}

async function create(cita) {
  const nueva = { id: siguienteId++, ...cita };
  citas.push(nueva);
  return nueva;
}

module.exports = { findAll, findById, findByMedicoYFechaHora, create };
