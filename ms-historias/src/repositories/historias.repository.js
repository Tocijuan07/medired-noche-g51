// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const historias = [
  { id: 1, paciente_id: 1, medico_id: 1, fecha: '2026-11-09', motivo_consulta: 'Dolor de cabeza', diagnostico: 'Cefalea tensional', tratamiento: 'Reposo, hidratación y analgesia' },
  { id: 2, paciente_id: 2, medico_id: 2, fecha: '2026-07-17', motivo_consulta: 'Fiebre y malestar general', diagnostico: 'Síndrome viral', tratamiento: 'Manejo sintomático e hidratación' },
  { id: 3, paciente_id: 3, medico_id: 3, fecha: '2026-09-30', motivo_consulta: 'Tos y congestión nasal', diagnostico: 'Resfriado común', tratamiento: 'Lavados nasales y reposo' },
];
let siguienteId = 4;

async function findAll() {
  return historias;
}

async function findById(id) {
  return historias.find((h) => h.id === id) || null;
}

async function findDuplicada(paciente_id, medico_id, fecha) {
  return historias.find((h) => h.paciente_id === paciente_id && h.medico_id === medico_id && h.fecha === fecha) || null;
}

async function create(historia) {
  const nuevo = { id: siguienteId++, ...historia };
  historias.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, findDuplicada, create };
