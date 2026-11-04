// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/medicos.repository');
const { validarMedico, construirMedico } = require('../models/medico');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const medico = await repo.findById(id);
  if (!medico) throw new HttpError(404, `No existe el medico con id ${id}`);
  return medico;
}

async function crear(datos) {
  const errores = validarMedico(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const medico = construirMedico(datos);

  //  Regla de negocio: no puede haber dos médicos con el mismo registro médico. 409 = Conflict.
 if (await repo.findByRegistroMedico(medico.registro_medico)) {
    throw new HttpError(409, `Ya existe un medico con el registro médico ${medico.registro_medico}`);
  }

  return repo.create(medico);
}

async function actualizar(id, datos) {
  const existente = await repo.findById(id);
  if (!existente) throw new HttpError(404, `No existe el medico con id ${id}`);

  const errores = validarMedico(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const medico = construirMedico(datos);

  const otro = await repo.findByRegistroMedico(medico.registro_medico);
  if (otro && otro.id !== id) {
    throw new HttpError(409, `Ya existe un medico con el registro médico ${medico.registro_medico}`);
  }
  return repo.actualizar(id, medico);
}

async function eliminar(id) {
  const eliminado = await repo.eliminar(id);
  if (!eliminado) throw new HttpError(404, `Medico no encontrado ${id}` );
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
