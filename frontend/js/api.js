// =====================================================================
// API: TODAS las llamadas a los microservicios pasan por aquí, a través
// del gateway (/api/<recurso>).
//   api('/pacientes')                                  → GET
//   api('/pacientes', { method: 'POST', body: {...} }) → POST
// Agrega el token, convierte la respuesta en JSON y, si hay error,
// lanza un ErrorApi con el código y el mensaje del microservicio.
// =====================================================================
class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = Array.isArray(detalles) ? detalles : [];
  }
}

// Mensajes de respaldo para respuestas que no traen JSON. Por ejemplo, cuando un
// microservicio está detenido, es APACHE (no el microservicio) quien responde 503
// con una página HTML.
const MENSAJE_POR_CODIGO = {
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión terminó. Inicie sesión de nuevo.',
  403: 'Su rol no tiene permiso para esta operación.',
  404: 'No se encontró lo que pidió.',
  409: 'La operación entra en conflicto con un registro existente.',
  500: 'Error interno del servidor.',
  502: 'El gateway no pudo hablar con el servicio.',
  503: 'El servicio no está disponible en este momento. Intente de nuevo más tarde.',
  504: 'El servicio tardó demasiado en responder.',
};

async function api(ruta, opciones = {}) {
  const token = sessionStorage.getItem('token');
  const cabeceras = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      method: opciones.method || 'GET',
      headers: cabeceras,
      body: opciones.body ? JSON.stringify(opciones.body) : undefined,
    });
  } catch (error) {
    // No hubo respuesta: servidor2 apagado, Apache detenido o sin red
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revise la red y que Apache esté en marcha.');
  }

  if (respuesta.status === 401 && ruta !== '/usuarios/login') {
    cerrarSesion();                    // sin sesión o token vencido: volver a entrar
    return null;
  }

  // La respuesta puede no ser JSON (204 sin cuerpo, o la página HTML de error de Apache)
  let datos = null;
  if (respuesta.status !== 204) {
    const texto = await respuesta.text();
    try { datos = texto ? JSON.parse(texto) : null; } catch (error) { datos = null; }
  }

  if (!respuesta.ok) {
    if (respuesta.status >= 500 && datos && datos.error) {
      // El detalle de un error interno (por ejemplo, de MySQL) es para el administrador, no para el usuario
      console.error(`[${respuesta.status}] ${ruta}:`, datos.error);
    }
    const mensaje = respuesta.status === 500
      ? MENSAJE_POR_CODIGO[500]
      : (datos && datos.error) || MENSAJE_POR_CODIGO[respuesta.status] || `Error ${respuesta.status}`;
    throw new ErrorApi(respuesta.status, mensaje, datos && datos.detalles);
  }
  return datos;
}
