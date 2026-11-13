// =====================================================================
// CLIENTE HTTP de ms-pacientes (patrón: acceso a algo externo).
// Valida que el paciente exista al crear/actualizar una cita, y trae
// varios pacientes en UNA sola petición (?ids=) al componer respuestas.
// =====================================================================
const HttpError = require('../utils/http-error');
const PACIENTES_URL = process.env.PACIENTES_URL;

// Hace la petición reenviando el token del usuario. null si no hubo respuesta.
async function pedir(ruta, token) {
  try {
    return await fetch(`${PACIENTES_URL}${ruta}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    return null; // ms-pacientes caído o sin responder
  }
}

// VALIDACIÓN: ¿existe el paciente? Si ms-pacientes no responde → 503
async function existePaciente(id, token) {
  const respuesta = await pedir(`/pacientes/${id}`, token);
  if (!respuesta) throw new HttpError(503, 'ms-pacientes no está disponible');
  if (respuesta.status === 404) return false;
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-pacientes respondió ${respuesta.status}`);
  }
  return true;
}

// COMPOSICIÓN: varios pacientes en UNA petición → Map id → paciente
async function pacientesPorIds(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/pacientes?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const pacientes = await respuesta.json();
  return new Map(pacientes.map((p) =>
    [p.id, { id: p.id, nombre: p.nombre, documento: p.documento, eps: p.eps }]));
}

module.exports = { existePaciente, pacientesPorIds };
