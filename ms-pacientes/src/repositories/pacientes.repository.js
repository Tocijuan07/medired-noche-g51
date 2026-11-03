// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const pool = require('../db');

function aPaciente(fila){
  return { ...fila, activo: Boolean(fila.activo) };
}
const pacientes = [
  { id: 1, nombre: 'Oscar Jimenez', documento: '1001234567', fecha_nacimiento: '2004-10-28', eps: 'comfenalco' , telefono: '3154414635' },
  { id: 2, nombre: 'Ilana Urrea', documento: '1007654321', fecha_nacimiento: '2006-05-09', eps: 'comfandi' , telefono:'3053124241' },
  { id: 3, nombre: 'Juan Damigo', documento: '1009876543', fecha_nacimiento: '2005-07-09', eps: 'sura', telefono:'3193378512'},
];
let siguienteId = 4;

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM pacientes';
  const condiciciones = [];
  const valores = [];
  if (filtros.eps) {
    condiciciones.push('eps = ?');
    valores.push(filtros.eps);
  }
  if (filtros.ids) {
    condiciciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  if (condiciciones.length > 0) sql += ' WHERE ' + condiciciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas.map(aPaciente);
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [id]);
  return filas.length > 0 ? aPaciente(filas[0]) : null;
}

async function findByDocumento(documento) {
  const [filas] = await pool.query('SELECT * FROM pacientes WHERE documento = ?', [documento]);
  return filas.length > 0 ? aPaciente(filas[0]) : null;
}

async function create(paciente) {
  const [resultado] = await pool.query('INSERT INTO pacientes (nombre, documento, fecha_nacimiento, eps, telefono) VALUES (?, ?, ?, ?, ?)',
  [paciente.nombre, paciente.documento, paciente.fecha_nacimiento, paciente.eps, paciente.telefono]);
  return findById(resultado.insertId);
}

async function actualizar(id, paciente) {
  const [resultado] = await pool.query('UPDATE pacientes SET nombre = ?, documento = ?, fecha_nacimiento = ?, eps = ?, telefono = ? WHERE id = ?',
    [paciente.nombre, paciente.documento, paciente.fecha_nacimiento, paciente.eps, paciente.telefono, id]);
    if (resultado.affectedRows === 0) return null;
  return findById(id);
}

async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM pacientes WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
  }

module.exports = { findAll, findById, findByDocumento, create, actualizar, eliminar };
