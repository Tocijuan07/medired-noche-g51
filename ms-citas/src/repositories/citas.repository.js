// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión con MySQL: los datos se guardan en la base medired_citas.
// Todas las funciones son async (devuelven promesas) para que la capa
// de servicio no cambie.
// =====================================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'medired_citas',
  waitForConnections: true,
  connectionLimit: 10,
});

async function findAll() {
  const [filas] = await pool.query('SELECT * FROM citas ORDER BY id');
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM citas WHERE id = ?', [id]);
  return filas[0] || null;
}

async function findByMedicoYFechaHora(medico_id, fecha_hora, excluirId) {
  const [filas] = await pool.query(
    'SELECT * FROM citas WHERE medico_id = ? AND fecha_hora = ? AND id <> ? LIMIT 1',
    [medico_id, fecha_hora, excluirId ?? 0],
  );
  return filas[0] || null;
}

async function create(cita) {
  const [resultado] = await pool.query(
    'INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES (?, ?, ?, ?, ?)',
    [cita.paciente_id, cita.medico_id, cita.fecha_hora, cita.sede, cita.estado],
  );
  return { id: resultado.insertId, ...cita };
}

async function update(id, datos) {
  const [resultado] = await pool.query(
    'UPDATE citas SET paciente_id = ?, medico_id = ?, fecha_hora = ?, sede = ?, estado = ? WHERE id = ?',
    [datos.paciente_id, datos.medico_id, datos.fecha_hora, datos.sede, datos.estado, id],
  );
  if (resultado.affectedRows === 0) return null;
  return { id, ...datos };
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM citas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByMedicoYFechaHora, create, update, remove };
