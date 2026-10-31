// =====================================================================
// CAPA DE MODELO (entidad)
// Definir qué campos tiene una Historia y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Versión del Taller 1: todavía sin contraseña. La contraseña cifrada
// y el inicio de sesión se agregan en la versión completa (Taller 3).
//
// Una historia se asocia a un paciente (paciente_id) y al médico que
// atendió la consulta (medico_id). Ambos IDs pertenecen a otros
// microservicios (ms-pacientes y ms-usuarios), por eso aquí solo se
// valida su formato, no su existencia.
// =====================================================================

// Un texto es válido si es string y no está vacío
function textoValido(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// Un ID es válido si es un entero positivo (o un string numérico)
function idValido(v) {
  const n = Number(v);
  return v !== null && v !== '' && Number.isInteger(n) && n > 0;
}

// Fecha con formato AAAA-MM-DD y que exista en el calendario
function fechaValida(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarHistoria(datos) {
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos de la historia clínica'];
  }
  const errores = [];
  if (!idValido(datos.paciente_id)) errores.push('paciente_id es obligatorio y debe ser un número entero positivo');
  if (!idValido(datos.medico_id)) errores.push('medico_id es obligatorio y debe ser un número entero positivo');
  if (!fechaValida(datos.fecha)) errores.push('fecha es obligatoria con formato AAAA-MM-DD');
  if (!textoValido(datos.motivo_consulta)) errores.push('motivo_consulta es obligatorio');
  if (!textoValido(datos.diagnostico)) errores.push('diagnostico es obligatorio');
  if (!textoValido(datos.tratamiento)) errores.push('tratamiento es obligatorio');
  // medicamento_id es opcional: no todas las consultas recetan algo
  if (datos.medicamento_id !== undefined && datos.medicamento_id !== null && !idValido(datos.medicamento_id)) {
    errores.push('medicamento_id debe ser un número entero positivo');
  }
  return errores;
}

// Construye una historia "limpia" solo con los campos permitidos
// (el id lo genera la base de datos / repositorio, no viene del cliente)
function construirHistoria(datos) {
  return {
    paciente_id: Number(datos.paciente_id),
    medico_id: Number(datos.medico_id),
    fecha: datos.fecha,
    motivo_consulta: datos.motivo_consulta.trim(),
    diagnostico: datos.diagnostico.trim(),
    tratamiento: datos.tratamiento.trim(),
    medicamento_id:
      datos.medicamento_id === undefined || datos.medicamento_id === null
        ? null
        : Number(datos.medicamento_id),
  };
}

module.exports = { validarHistoria, construirHistoria };