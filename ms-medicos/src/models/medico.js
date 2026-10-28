// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Médico y qué reglas deben cumplir
//Versión del Taller 1: todavía sin contraseña. La contraseña cifrada
   // y el inicio de sesión se agregan en la versión completa (Taller 3).
// =====================================================================

// Sedes válidas de la clínica
const SEDES = ['Bogotá', 'Cali', 'Medellín'];

// Quita tildes, mayúsculas y espacios para comparar ("Bogotá" == "bogota")
function normalizar(texto) {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Devuelve la sede con su escritura oficial, o undefined si no es válida
function buscarSede(valor) {
  if (typeof valor !== 'string') return undefined;
  return SEDES.find((s) => normalizar(s) === normalizar(valor));
}

function textoValido(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarMedico(datos) {
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del médico'];
  }
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio');
  if (!textoValido(datos.registro_medico)) errores.push('registro_medico es obligatorio');
  if (!textoValido(datos.especialidad)) errores.push('especialidad es obligatoria');
  if (!buscarSede(datos.sede)) errores.push(`sede debe ser una de: ${SEDES.join(', ')}`);
  return errores;
}

// Construye un médico "limpio" solo con los campos permitidos
function construirMedico(datos) {
  return {
    nombre: datos.nombre.trim(),
    registro_medico: datos.registro_medico.trim(),
    especialidad: datos.especialidad.trim(),
    sede: buscarSede(datos.sede),
  };
}

module.exports = { validarMedico, construirMedico };
