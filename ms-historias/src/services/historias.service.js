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

// Relación: el paciente referenciado debe existir en ms-pacientes

async function validarPaciente(pacienteId, token) {

  if (!(await pacientesClient.existePaciente(pacienteId, token))) {

    throw new HttpError(400, `No existe el paciente con id ${pacienteId}`);
  }

}

async function validarMedico(medicoId, token) {

  if (!(await medicosClient.existeMedico(medicoId, token))) {

    throw new HttpError(400, `No existe el médico con id ${medicoId}`);

  }

}

// Agrega a cada historia su objeto paciente y medico, con UNA sola consulta a ms-pacientes y ms-medicos, respectivamente. Si no se puede obtener la información de ms-pacientes o ms-medicos, se devuelve null en el objeto paciente o medico y un aviso de degradación controlada.

async function componer(historias, token) {

  const pacienteIds = historias.map((p) => p.paciente_id);
  const medicoIds = historias.map((p) => p.medico_id);

  const idsPacientes = [...new Set(pacienteIds)];
  const idsMedicos = [...new Set(medicoIds)];

  let pacientes = null;
  let medicos = null;

  // Consultar ms-pacientes
  try {
    pacientes = await pacientesClient.pacientesPorIds(idsPacientes, token);
  } catch (error) {
    console.error('Error consultando ms-pacientes:', error.message);
  }

  // Consultar ms-medicos
  try {
    medicos = await medicosClient.medicosPorIds(idsMedicos, token);
  } catch (error) {
    console.error('Error consultando ms-medicos:', error.message);
  }

  // Componer respuesta
  return historias.map((p) => ({
    ...p,

    paciente: pacientes
      ? pacientes.get(p.paciente_id) || null
      : null,

    medico: medicos
      ? medicos.get(p.medico_id) || null
      : null,

    ...(!pacientes && !medicos
      ? { aviso: 'ms-pacientes y ms-medicos no disponibles' }
      : !pacientes
        ? { aviso: 'ms-pacientes no disponible' }
        : !medicos
          ? { aviso: 'ms-medicos no disponible' }
          : {})
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

  // fecha local AAAA-MM-DD (toISOString usaría UTC y podría adelantar el día)
  const hoy = new Date().toLocaleDateString('en-CA');
  if (historia.fecha > hoy) throw new HttpError(400, 'La fecha de la historia no puede ser futura');

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
  await validarPaciente(historia.paciente_id, token);
  await validarMedico(historia.medico_id, token);
  const otra = await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha);
  if (otra && otra.id !== id) throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
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
