// =====================================================================
// CONEXIÓN A MySQL — única fuente de la configuración de la base.
// Los datos de conexión salen del archivo .env (nunca en el código).
// =====================================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // fechas como texto '2026-11-10', no como objetos Date
});

module.exports = pool;
