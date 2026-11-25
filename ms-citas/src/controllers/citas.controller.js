// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// 
// =====================================================================
const service = require('../services/citas.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// Lee un filtro numérico opcional (?medico_id=, ?paciente_id=): 400 si no es entero positivo
function leerIdFiltro(req, nombre) {
  if (req.query[nombre] === undefined) return undefined;
  const valor = Number(req.query[nombre]);
  if (!Number.isInteger(valor) || valor <= 0) throw new HttpError(400, `${nombre} debe ser un entero positivo`);
  return valor;
}

// GET /citas  (?sede= ?estado= ?medico_id= ?paciente_id= ?fecha=AAAA-MM-DD)
async function listar(req, res) {
  const filtros = {
    sede: req.query.sede,
    estado: req.query.estado,
    medico_id: leerIdFiltro(req, 'medico_id'),
    paciente_id: leerIdFiltro(req, 'paciente_id'),
    fecha: req.query.fecha,
  };
  if (filtros.fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(filtros.fecha)) {
    throw new HttpError(400, 'fecha debe tener el formato AAAA-MM-DD');
  }
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
