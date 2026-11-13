// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio) — versión MySQL
// Única capa que sabe dónde y cómo se guardan los datos.
// Todas las consultas usan parámetros (?) para evitar la inyección SQL.
// =====================================================================
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM historias';
  const params = [];
  const condiciones = [];

  if (filtros.fecha) {
    condiciones.push('fecha = ?');
    params.push(filtros.fecha);
  }

  if (filtros.paciente_id) {
    condiciones.push('paciente_id = ?');
    params.push(filtros.paciente_id);
  }

  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }

  const [filas] = await pool.query(sql + ' ORDER BY id', params);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM historias WHERE id = ?', [id]);
  return filas[0] || null;
}

async function findDuplicada(paciente_id, medico_id, fecha) {
  const [filas] = await pool.query(
    'SELECT * FROM historias WHERE paciente_id = ? AND medico_id = ? AND fecha = ?',
    [paciente_id, medico_id, fecha]);
  return filas[0] || null;
}

async function create(h) {
  const [r] = await pool.query(
    'INSERT INTO historias (paciente_id, medico_id, fecha, motivo_consulta, diagnostico, tratamiento) VALUES (?, ?, ?, ?, ?, ?)',
    [h.paciente_id, h.medico_id, h.fecha, h.motivo_consulta, h.diagnostico, h.tratamiento]);
  return findById(r.insertId);
}

async function actualizar(id, h) {
  const [r] = await pool.query(
    'UPDATE historias SET paciente_id = ?, medico_id = ?, fecha = ?, motivo_consulta = ?, diagnostico = ?, tratamiento = ? WHERE id = ?',
    [h.paciente_id, h.medico_id, h.fecha, h.motivo_consulta, h.diagnostico, h.tratamiento, id]);
  if (r.affectedRows === 0) return null;
  return findById(id);
}

async function eliminar(id) {
  const [result] = await pool.query('DELETE FROM historias WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, findDuplicada, create, actualizar, eliminar };