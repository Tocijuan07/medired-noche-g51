// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Usuario y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Versión del Taller 1: todavía sin contraseña. La contraseña cifrada
// y el inicio de sesión se agregan en la versión completa (Taller 3).
// =====================================================================

// Los roles válidos vienen del archivo .env (cada empresa tiene los suyos)
function textoValido(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarPaciente(datos) {
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del paciente'];
  }
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio');
  if (!textoValido(datos.documento)) errores.push('documento es obligatorio');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_nacimiento) || isNaN(Date.parse(datos.fecha_nacimiento))) {
    errores.push('fecha_nacimiento es obligatoria con formato AAAA-MM-DD');
  }
  if (!textoValido(datos.eps)) errores.push('eps es obligatoria');
  if (!textoValido(datos.telefono)) errores.push('telefono es obligatorio');
  return errores;
}

// Construye un paciente "limpio" solo con los campos permitidos
function construirPaciente(datos) {
  return {
    nombre: datos.nombre.trim(),
    documento: datos.documento.trim(),
    fecha_nacimiento: datos.fecha_nacimiento,
    eps: datos.eps.trim(),
    telefono: datos.telefono.trim(),
  };
}

module.exports = { validarPaciente, construirPaciente };
