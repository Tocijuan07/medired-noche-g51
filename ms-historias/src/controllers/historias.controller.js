// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/historias.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /historias
async function listar(req, res) {
  const filtros = {fecha: req.query.fecha};
  if (req.query.paciente_id) {
    filtros.paciente_id = Number(req.query.paciente_id);
    if(!Number.isInteger(filtros.paciente_id) || filtros.paciente_id <= 0) throw new HttpError(400, 'El paciente_id debe ser un entero positivo');
  }
  const historias = await service.listar(filtros);
  res.status(200).json(await service.listar({ estado: req.query.estado }, req.headers.authorization));​
  res.status(200).json(historias);
}
// GET /historias/:id
async function obtener(req, res) {
  const historia = await service.obtener(leerId(req));
  res.status(200).json(await service.obtener(leerId(req), req.headers.authorization));​
  res.status(200).json(historia);
}

// POST /historias
async function crear(req, res) {
  const nuevo = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

//UPDATE /historias/:id
async function actualizar(req, res) {
  const id = leerId(req);
  const historiaActualizada = await service.actualizar(id, req.body, req.headers.authorization);
  res.status(200).json(historiaActualizada);
}

// DELETE /historias/:id
async function eliminar(req, res) {
  const id = leerId(req);
  await service.eliminar(id);
  res.status(204).end();
}
module.exports = { listar, obtener, crear, actualizar, eliminar };