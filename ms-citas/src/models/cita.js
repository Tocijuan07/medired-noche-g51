// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene una Cita y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Una cita se asocia a un paciente (paciente_id) y a un médico (medico_id).
// Esos IDs pertenecen a otros microservicios (ms-pacientes y ms-medicos),
// por eso aquí solo se valida su formato, no su existencia.
// =====================================================================

function listaDesdeEnv(nombre, valorPorDefecto) {
  return (process.env[nombre] || valorPorDefecto)
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '');
}

function sedesValidas() {
  return listaDesdeEnv('SEDES', 'Bogotá,Cali,Medellín');
}

function estadosValidos() {
  return listaDesdeEnv('ESTADOS', 'programada,atendida,cancelada');
}

function normalizar(texto) {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buscarEnLista(valor, lista) {
  if (typeof valor !== 'string') return undefined;
  return lista.find((item) => normalizar(item) === normalizar(valor));
}

function idValido(v) {
  const n = Number(v);
  return v !== null && v !== '' && Number.isInteger(n) && n > 0;
}

// Fecha y hora con formato AAAA-MM-DDTHH:MM (ISO local sin segundos)
function fechaHoraValida(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return false;
  const fecha = new Date(`${v}:00`);
  return !isNaN(fecha.getTime());
}

function validarCita(datos) {
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos de la cita'];
  }
  const errores = [];
  if (!idValido(datos.paciente_id)) {
    errores.push('paciente_id es obligatorio y debe ser un número entero positivo');
  }
  if (!idValido(datos.medico_id)) {
    errores.push('medico_id es obligatorio y debe ser un número entero positivo');
  }
  if (!fechaHoraValida(datos.fecha_hora)) {
    errores.push('fecha_hora es obligatoria con formato AAAA-MM-DDTHH:MM');
  }
  if (!buscarEnLista(datos.sede, sedesValidas())) {
    errores.push(`sede debe ser una de: ${sedesValidas().join(', ')}`);
  }
  if (datos.estado !== undefined && !buscarEnLista(datos.estado, estadosValidos())) {
    errores.push(`estado debe ser uno de: ${estadosValidos().join(', ')}`);
  }
  return errores;
}

function construirCita(datos) {
  return {
    paciente_id: Number(datos.paciente_id),
    medico_id: Number(datos.medico_id),
    fecha_hora: datos.fecha_hora,
    sede: buscarEnLista(datos.sede, sedesValidas()),
    estado: datos.estado === undefined
      ? 'programada'
      : buscarEnLista(datos.estado, estadosValidos()),
  };
}

module.exports = { validarCita, construirCita };
