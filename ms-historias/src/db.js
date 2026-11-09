const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'historias_user',
  password: process.env.DB_PASSWORD || 'historias_pass',
  database: process.env.DB_NAME || 'historias_db',
  dateStrings: true, // para que las fechas se devuelvan como strings y no como objetos Date
  decimalNumbers: true // para que los números decimales se devuelvan como números y no como strings
});

module.exports = pool;