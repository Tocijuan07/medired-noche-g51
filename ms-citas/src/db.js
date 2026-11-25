// =====================================================================
// Conexión a MySQL con los datos del archivo .env
// (el mismo archivo que en ms-pacientes, ms-medicos y ms-historias;
// solo cambia el .env). Las credenciales NUNCA se escriben en el código.
// =====================================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,    // las fechas llegan como texto '2026-11-12 08:30:00', no como objetos Date
  decimalNumbers: true, // los DECIMAL llegan como números, no como texto
});

module.exports = pool;
