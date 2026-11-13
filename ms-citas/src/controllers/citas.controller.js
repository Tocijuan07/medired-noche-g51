// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/citas.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /citas
async function listar(req, res) {
  const filtros = {
    sede: req.query.sede,
    estado: req.query.estado,
    medico_id: req.query.medico_id,
    paciente_id: req.query.paciente_id,
  };
  const citas = await service.listar(filtros, req.headers.authorization);
  res.status(200).json(citas);
}

// GET /citas/:id
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req), req.headers.authorization);
  res.status(200).json(cita);
}

// POST /citas
async function crear(req, res) {
  const nueva = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

// PUT /citas/:id
async function actualizar(req, res) {
  const actualizada = await service.actualizar(leerId(req), req.body, req.headers.authorization);
  res.status(200).json(actualizada);
}

// DELETE /citas/:id
async function eliminar(req, res) {
  await service.eliminar(leerId(req));
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
