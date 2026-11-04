-- db/schema.sql
SET NAMES utf8mb4; -- para que las tildes y ñ se guarden correctamente

DROP TABLE IF EXISTS medicos;

CREATE TABLE medicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  registro_medico VARCHAR(20) NOT NULL UNIQUE,
  especialidad VARCHAR(100) NOT NULL,
  sede VARCHAR(100) NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT INTO medicos (nombre, registro_medico, especialidad, sede) VALUES
('Dr. Juan Pérez', 'RM-10001', 'Cardiología', 'Bogotá'),
('Dra. María Gómez', 'RM-10002', 'Neurología', 'Cali'),
('Dr. Carlos Rodríguez', 'RM-10003', 'Pediatría', 'Medellín');