// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM pacientes';
  const condiciones = [];
  const valores = [];
  if (filtros.eps) { condiciones.push('eps = ?'); valores.push(filtros.eps); }
  if (filtros.ids) { condiciones.push('id IN (?)'); valores.push(filtros.ids); }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function findByDocumento(documento) {
  const [filas] = await pool.query('SELECT * FROM pacientes WHERE documento = ?', [documento]);
     return filas.length > 0 ? filas[0] : null;
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
