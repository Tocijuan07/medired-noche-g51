// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const historias = [
{ id: 1, paciente_id: 5, medico_id: 7, fecha: "2026-11-09", motivo_consulta: "Dolor de cabeza", diagnostico: "Cefalea tensional", tratamiento: "Reposo, hidratación y analgesia",
medicamento_id: 12345, paciente: {id: 5, nombre: "Ana Ruiz"}, medico: {id: 7, nombre: "Carlos Pérez", especialidad: "Pediatría"}, medicamento: {id: 12345, nombre: "Acetaminofén", precio: "$9.000"} },
{ id: 2, paciente_id: 6, medico_id: 8, fecha: "2026-07-17", motivo_consulta: "Fiebre y malestar general", diagnostico: "Síndrome viral", tratamiento: "Manejo sintomático e hidratación",
medicamento_id: 123456, paciente: {id: 6, nombre: "Mokey D. Luffy"}, medico: {id: 8, nombre: "Stephen Strange", especialidad: "Cirujano"}, medicamento: {id: 123456, nombre: "Acetaminofén", precio: "$9.000"} },
{ id: 3, paciente_id: 7, medico_id: 9, fecha: "2026-09-30", motivo_consulta: "Tos y congestión nasal", diagnostico: "Resfriado común", tratamiento: "Lavados nasales y reposo",
medicamento_id: 1234567, paciente: {id: 7, nombre: "Micola Tesla"}, medico: {id: 9, nombre: "Yoshikage Kira", especialidad: "Ginecólogo"}, medicamento: {id: 1234567, nombre: "Solución salina nasal", precio: "$12.000"} }
];
let siguienteId = 4;

async function findAll() {
  return historias;
}

async function findById(id) {
  return historias.find((u) => u.id === id) || null;
}

async function findByPaciente(paciente_id) {
  return historias.find((u) => u.paciente_id === paciente_id) || null;
}

async function create(historia) {
  const nuevo = { id: siguienteId++, ...historia };
  historias.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, findByPaciente, create };
