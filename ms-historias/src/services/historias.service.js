// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia con id ${id}`);
  return historia;
}

async function crear(datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);

  // Regla de negocio: no puede repetirse la misma atención (mismo paciente, médico y fecha). 409 = Conflict.
  if (await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha)) {
    throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  }
  return repo.create(historia);
}

async function actualizar(id, datos) {
  const existente = await repo.findById(id);
  if (!existente) throw new HttpError(404, `No existe la historia con id ${id}`);
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const historia = construirHistoria(datos);

  const otra = await repo.findDuplicada(historia.paciente_id, historia.medico_id, historia.fecha);
  if (otra && otra.id !== id) throw new HttpError(409, 'Ya existe una historia de este paciente con este médico en esa fecha');
  return repo.actualizar(id, historia);
}

async function eliminar(id) {
  const eliminado = await repo.eliminar(id);
  if (!eliminado) throw new HttpError(404, `No existe la historia con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };