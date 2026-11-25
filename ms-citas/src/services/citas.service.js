// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio, las validaciones y las RELACIONES con
// ms-pacientes y ms-medicos (a través de src/clients/).
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/citas.repository');
const { validarCita, construirCita } = require('../models/cita');
const HttpError = require('../utils/http-error');

const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medicos.client');

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

// COMPOSICIÓN: agrega a cada cita sus objetos paciente y medico, con UNA sola
// consulta ?ids= a cada microservicio. Si alguno no responde, el objeto queda en null
// y se agrega un aviso (degradación controlada): la respuesta sale igual con 200.
async function componer(citas, token) {
  const idsPacientes = [...new Set(citas.map((c) => c.paciente_id))];
  const idsMedicos = [...new Set(citas.map((c) => c.medico_id))];

  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(idsPacientes, token),
    medicosClient.medicosPorIds(idsMedicos, token),
  ]);

  let aviso;
  if (!pacientes && !medicos) aviso = 'ms-pacientes y ms-medicos no disponibles';
  else if (!pacientes) aviso = 'ms-pacientes no disponible';
  else if (!medicos) aviso = 'ms-medicos no disponible';

  return citas.map((c) => ({
    ...c,
    paciente: pacientes ? pacientes.get(c.paciente_id) || null : null,
    medico: medicos ? medicos.get(c.medico_id) || null : null,
    ...(aviso ? { aviso } : {}),
  }));
}

// Regla de negocio: un médico no puede tener dos citas activas en la misma fecha y hora (409).
// Si la cita que se guarda está cancelada, no ocupa el horario y no se revisa.
async function validarHorarioLibre(cita, excluirId) {
  if (cita.estado === 'cancelada') return;
  if (await repo.findByMedicoYFechaHora(cita.medico_id, cita.fecha_hora, excluirId)) {
    throw new HttpError(409, `El médico ${cita.medico_id} ya tiene una cita en ${cita.fecha_hora}`);
  }
}

async function listar(filtros, token) {
  return componer(await repo.findAll(filtros), token);
}

async function obtener(id, token) {
  const cita = await repo.findById(id);
  if (!cita) throw new HttpError(404, `No existe la cita con id ${id}`);
  const [compuesta] = await componer([cita], token);
  return compuesta;
}

async function crear(datos, token) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const cita = construirCita(datos);

  await validarHorarioLibre(cita);
  await validarPaciente(cita.paciente_id, token);
  await validarMedico(cita.medico_id, token);

  const nueva = await repo.create(cita);
  const [compuesta] = await componer([nueva], token);
  return compuesta;
}

async function actualizar(id, datos, token) {
  const existente = await repo.findById(id);
  if (!existente) throw new HttpError(404, `No existe la cita con id ${id}`);

  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const cita = construirCita(datos);

  await validarHorarioLibre(cita, id);
  await validarPaciente(cita.paciente_id, token);
  await validarMedico(cita.medico_id, token);

  const actualizada = await repo.update(id, cita);
  if (!actualizada) throw new HttpError(404, `No existe la cita con id ${id}`);
  const [compuesta] = await componer([actualizada], token);
  return compuesta;
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la cita con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
