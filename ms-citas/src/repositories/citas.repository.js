// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio) — versión MySQL
// Única capa que sabe DÓNDE y CÓMO se guardan los datos (base citas_db).
// Todas las consultas usan parámetros (?) para evitar la inyección SQL.
// La conexión (con los datos del .env) está en src/db.js.
// =====================================================================
const pool = require('../db');

// MySQL entrega '2026-11-12 08:30:00'; el contrato de la API usa '2026-11-12T08:30'
function aContrato(fila) {
  return { ...fila, fecha_hora: String(fila.fecha_hora).replace(' ', 'T').slice(0, 16) };
}

// filtros: { sede, estado, medico_id, paciente_id, fecha } (todos opcionales)
async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM citas';
  const condiciones = [];
  const valores = [];

  if (filtros.sede) { condiciones.push('sede = ?'); valores.push(filtros.sede); }
  if (filtros.estado) { condiciones.push('estado = ?'); valores.push(filtros.estado); }
  if (filtros.medico_id) { condiciones.push('medico_id = ?'); valores.push(filtros.medico_id); }
  if (filtros.paciente_id) { condiciones.push('paciente_id = ?'); valores.push(filtros.paciente_id); }
  if (filtros.fecha) { condiciones.push('DATE(fecha_hora) = ?'); valores.push(filtros.fecha); }

  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY fecha_hora, id', valores);
  return filas.map(aContrato);
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM citas WHERE id = ?', [id]);
  return filas.length > 0 ? aContrato(filas[0]) : null;
}

// Regla de negocio: ¿el médico ya tiene otra cita (no cancelada) en esa fecha y hora?
// excluirId permite ignorar la propia cita al actualizarla.
async function findByMedicoYFechaHora(medico_id, fecha_hora, excluirId) {
  const [filas] = await pool.query(
    `SELECT * FROM citas
      WHERE medico_id = ? AND fecha_hora = ? AND estado <> 'cancelada' AND id <> ?
      LIMIT 1`,
    [medico_id, fecha_hora, excluirId ?? 0],
  );
  return filas.length > 0 ? aContrato(filas[0]) : null;
}

async function create(cita) {
  const [resultado] = await pool.query(
    'INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES (?, ?, ?, ?, ?)',
    [cita.paciente_id, cita.medico_id, cita.fecha_hora, cita.sede, cita.estado],
  );
  return findById(resultado.insertId); // MySQL devuelve el id generado
}

async function update(id, cita) {
  const [resultado] = await pool.query(
    'UPDATE citas SET paciente_id = ?, medico_id = ?, fecha_hora = ?, sede = ?, estado = ? WHERE id = ?',
    [cita.paciente_id, cita.medico_id, cita.fecha_hora, cita.sede, cita.estado, id],
  );
  if (resultado.affectedRows === 0) return null; // no había fila con ese id
  return findById(id);
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM citas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByMedicoYFechaHora, create, update, remove };
