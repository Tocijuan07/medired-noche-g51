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
  let sql = 'SELECT * FROM medicos';
  const condiciciones = [];
  const valores = [];
  if (filtros.especialidad) {
    condiciciones.push('especialidad = ?');
    valores.push(filtros.especialidad);
  }
  if (filtros.ids) {
    condiciciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  if (condiciciones.length > 0) sql += ' WHERE ' + condiciciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM medicos WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function findByRegistroMedico(registro_medico) {
  const [filas] = await pool.query('SELECT * FROM medicos WHERE registro_medico = ?', [registro_medico]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(medico) {
  const [result] = await pool.query('INSERT INTO medicos (nombre, registro_medico, especialidad, sede) VALUES (?, ?, ?, ?)', [
    medico.nombre,
    medico.registro_medico,
    medico.especialidad,
    medico.sede
  ]);
  return { id: result.insertId, ...medico };
}

async function actualizar(id, medico) {
  const [resultado] = await pool.query('UPDATE medicos SET nombre = ?, registro_medico = ?, especialidad = ?, sede = ? WHERE id = ?',
    [medico.nombre, medico.registro_medico, medico.especialidad, medico.sede, id]);
    if (resultado.affectedRows === 0) return null;
  return findById(id);
}

async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM medicos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
  }

module.exports = { findAll, findById, findByRegistroMedico, create, actualizar, eliminar };
