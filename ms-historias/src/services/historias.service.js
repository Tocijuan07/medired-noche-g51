// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');

const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medicos.client');

// Regla (400): la fecha de la atención no puede ser futura.
// Se compara con la fecha local AAAA-MM-DD (toISOString usaría UTC y podría adelantar el día).
function validarFechaNoFutura(fecha) {
  const hoy = new Date().toLocaleDateString('en-CA');
  if (fecha > hoy) throw new HttpError(400, 'La fecha de la historia no puede ser futura');
}

// Relación: el paciente referenciado debe existir en ms-pacientes (400 si no existe, 503 si no responde)
async function validarPaciente(pacienteId, token) {
  if (!(await pacientesClient.existePaciente(pacienteId, token))) {
    throw new HttpError(400, `No existe el paciente con id ${pacienteId}`);
  }
}

// Relación: el médico referenciado debe existir en ms-medicos (400 si no existe, 503 si no responde)
async function validarMedico(medicoId, token) {
  if (!(await medicosClient.existeMedico(medicoId, token))) {
    throw new HttpError(400, `No existe el médico con id ${medicoId}`);
  }
}

// COMPOSICIÓN: agrega a cada historia sus objetos paciente y medico, con UNA sola
// consulta ?ids= a cada microservicio. Si alguno no responde, el objeto queda en null
// y se agrega un aviso (degradación controlada): la respuesta sale igual con 200.
async function componer(historias, token) {
  const idsPacientes = [...new Set(historias.map((h) => h.paciente_id))];
  const idsMedicos = [...new Set(historias.map((h) => h.medico_id))];

  const pacientes = await pacientesClient.pacientesPorIds(idsPacientes, token);
  const medicos = await medicosClient.medicosPorIds(idsMedicos, token);

  let aviso;
  if (!pacientes && !medicos) aviso = 'ms-pacientes y ms-medicos no disponibles';
  else if (!pacientes) aviso = 'ms-pacientes no disponible';
  else if (!medicos) aviso = 'ms-medicos no disponible';

  return historias.map((h) => ({
    ...h,
    paciente: pacientes ? pacientes.get(h.paciente_id) || null : null,
    medico: medicos ? medicos.get(h.medico_id) || null : null,
    ...(aviso ? { aviso } : {}),
  }));
}

async function listar(filtros, token) {
  return componer(await repo.findAll(filtros), token);
}

async function obtener(id, token) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia con id ${id}`);
  const [compuesto] = await componer([historia], token);
  return compuesto;
}

async function crear(datos, token) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);
  validarFechaNoFutura(historia.fecha);

  // Regla de negocio: no puede repetirse la misma atención (mismo paciente, médico y fecha). 409 = Conflict.
  if (await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha)) {
    throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  }
  await validarPaciente(historia.paciente_id, token);
  await validarMedico(historia.medico_id, token);
  const nuevo = await repo.create(historia);
  const [compuesto] = await componer([nuevo], token);
  return compuesto;
}

async function actualizar(id, datos, token) {
  const existente = await repo.findById(id);
  if (!existente) throw new HttpError(404, `No existe la historia con id ${id}`);
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);
  validarFechaNoFutura(historia.fecha);

  const otra = await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha);
  if (otra && otra.id !== id) {
    throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  }
  await validarPaciente(historia.paciente_id, token);
  await validarMedico(historia.medico_id, token);
  const actualizado = await repo.actualizar(id, historia);
  if (!actualizado) throw new HttpError(404, `No existe la historia con id ${id}`);
  const [compuesto] = await componer([actualizado], token);
  return compuesto;
}

async function eliminar(id) {
  const eliminado = await repo.eliminar(id);
  if (!eliminado) throw new HttpError(404, `No existe la historia con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };