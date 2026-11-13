// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// El token llega como un dato más (req.headers.authorization) y se
// reenvía a los microservicios consultados en la semana 2.
// =====================================================================
const repo = require('../repositories/citas.repository');
const { validarCita, construirCita } = require('../models/cita');
const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medicos.client');
const HttpError = require('../utils/http-error');

// Regla de negocio (400): la fecha de la cita debe estar en el futuro.
function fechaFutura(fechaHora) {
  return new Date(`${fechaHora}:00`).getTime() > Date.now();
}

// VALIDACIÓN DE REFERENCIAS: paciente y médico deben existir.
// El otro servicio caído → 503; el id no existe → 400.
async function validarReferencias(cita, token) {
  if (!(await pacientesClient.existePaciente(cita.paciente_id, token))) {
    throw new HttpError(400, `No existe el paciente con id ${cita.paciente_id}`);
  }
  if (!(await medicosClient.existeMedico(cita.medico_id, token))) {
    throw new HttpError(400, `No existe el médico con id ${cita.medico_id}`);
  }
}

// COMPOSICIÓN: agrega a cada cita su paciente y su médico, con UNA
// sola petición por lotes a cada microservicio (?ids=).
// Si un servicio no responde: el objeto sale en null + aviso
// (degradación controlada, la respuesta no se cae).
async function componer(citas, token) {
  const pacientesIds = [...new Set(citas.map((c) => c.paciente_id))];
  const medicosIds = [...new Set(citas.map((c) => c.medico_id))];

  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(pacientesIds, token),
    medicosClient.medicosPorIds(medicosIds, token),
  ]);

  return citas.map((c) => {
    const compuesta = { ...c };
    if (pacientes === null || medicos === null) {
      compuesta.paciente = pacientes ? pacientes.get(c.paciente_id) || null : null;
      compuesta.medico = medicos ? medicos.get(c.medico_id) || null : null;
      compuesta.aviso = 'Alguno de los microservicios relacionados no está disponible';
    } else {
      compuesta.paciente = pacientes.get(c.paciente_id) || null;
      compuesta.medico = medicos.get(c.medico_id) || null;
    }
    return compuesta;
  });
}

async function listar(filtros, token) {
  let resultado = await repo.findAll();
  if (filtros && filtros.sede) {
    resultado = resultado.filter((c) => c.sede === filtros.sede);
  }
  if (filtros && filtros.estado) {
    resultado = resultado.filter((c) => c.estado === filtros.estado);
  }
  if (filtros && filtros.medico_id) {
    resultado = resultado.filter((c) => c.medico_id === Number(filtros.medico_id));
  }
  if (filtros && filtros.paciente_id) {
    resultado = resultado.filter((c) => c.paciente_id === Number(filtros.paciente_id));
  }
  return componer(resultado, token);
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

  // Regla de negocio (400): la cita debe ser a futuro.
  if (!fechaFutura(cita.fecha_hora)) {
    throw new HttpError(400, 'fecha_hora debe estar en el futuro');
  }

  // Regla de negocio: un médico no puede tener dos citas en la misma fecha y hora.
  // 409 = Conflict.
  if (await repo.findByMedicoYFechaHora(cita.medico_id, cita.fecha_hora)) {
    throw new HttpError(
      409,
      `Ya existe una cita del médico ${cita.medico_id} en ${cita.fecha_hora}`,
    );
  }

  await validarReferencias(cita, token);

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

  // Regla de negocio (400): la cita debe ser a futuro.
  if (!fechaFutura(cita.fecha_hora)) {
    throw new HttpError(400, 'fecha_hora debe estar en el futuro');
  }

  if (await repo.findByMedicoYFechaHora(cita.medico_id, cita.fecha_hora, id)) {
    throw new HttpError(
      409,
      `Ya existe otra cita del médico ${cita.medico_id} en ${cita.fecha_hora}`,
    );
  }

  await validarReferencias(cita, token);

  const actualizada = await repo.update(id, cita);
  const [compuesta] = await componer([actualizada], token);
  return compuesta;
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la cita con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
