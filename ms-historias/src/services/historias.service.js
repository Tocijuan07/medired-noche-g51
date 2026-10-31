// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe el historia con id ${id}`);
  return historia;
}

async function crear(datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);

  // Regla de negocio: no puede haber dos historias con el mismo paciente_id
  // (el paciente_id es con lo que se inicia sesión). 409 = Conflict.
  if (await repo.findByPaciente(historia.paciente_id)) {
    throw new HttpError(409, `Ya existe un historia con el paciente_id ${historia.paciente_id}`);
  }

  return repo.create(historia);
}

module.exports = { listar, obtener, crear };
