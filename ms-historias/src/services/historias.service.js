// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');

const pacientesClient = require('../clients/pacientes.client');​
const medicosClient = require('../clients/medicos.client');​

// Relación: el paciente referenciado debe existir en ms-pacientes​

async function validarPaciente(pacienteId, token) {  ​

	if (!(await pacientesClient.existePaciente(pacienteId, token))) {    ​

		throw new HttpError(400, `No existe el paciente con id ${pacienteId}`);  ​

	}​

}​

async function validarMedico(medicoId, token) {  ​

	if (!(await medicosClient.existeMedico(medicoId, token))) {    ​

		throw new HttpError(400, `No existe el médico con id ${medicoId}`);  ​

	}​

}​

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia con id ${id}`);
  return historia;
}

async function crear(datos, token) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);

  // Regla de negocio: no puede repetirse la misma atención (mismo paciente, médico y fecha). 409 = Conflict.
  if (await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha)) {
    throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  }
   await validarPaciente(historia.paciente_id, token);​
   await validarMedico(historia.medico_id, token);​
  return repo.create(historia);
}

async function actualizar(id, datos, token) {
  const existente = await repo.findById(id);
  if (!existente) throw new HttpError(404, `No existe la historia con id ${id}`);
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);
 await validarPaciente(historia.paciente_id, token);​
 await validarMedico(historia.medico_id, token);​
  const otra = await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha);
  if (otra && otra.id !== id) throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  const actualizado = await repo.actualizar(id, historia);
  if (!actualizado) throw new HttpError(404, `No existe la historia con id ${id}`);
  return repo.actualizar(id, historia);
}

async function eliminar(id) {
  const eliminado = await repo.eliminar(id);
  if (!eliminado) throw new HttpError(404, `No existe la historia con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };