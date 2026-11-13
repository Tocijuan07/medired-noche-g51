// =====================================================================
// CLIENTE HTTP de ms-medicos (patrón: acceso a algo externo).
// Valida que el médico exista al crear/actualizar una cita, y trae
// varios médicos en UNA sola petición (?ids=) al componer respuestas.
// =====================================================================
const HttpError = require('../utils/http-error');
const MEDICOS_URL = process.env.MEDICOS_URL;

// Hace la petición reenviando el token del usuario. null si no hubo respuesta.
async function pedir(ruta, token) {
  try {
    return await fetch(`${MEDICOS_URL}${ruta}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    return null; // ms-medicos caído o sin responder
  }
}

// VALIDACIÓN: ¿existe el médico? Si ms-medicos no responde → 503
async function existeMedico(id, token) {
  const respuesta = await pedir(`/medicos/${id}`, token);
  if (!respuesta) throw new HttpError(503, 'ms-medicos no está disponible');
  if (respuesta.status === 404) return false;
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-medicos respondió ${respuesta.status}`);
  }
  return true;
}

// COMPOSICIÓN: varios médicos en UNA petición → Map id → médico
async function medicosPorIds(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/medicos?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const medicos = await respuesta.json();
  return new Map(medicos.map((m) =>
    [m.id, { id: m.id, nombre: m.nombre, especialidad: m.especialidad, sede: m.sede }]));
}

module.exports = { existeMedico, medicosPorIds };
