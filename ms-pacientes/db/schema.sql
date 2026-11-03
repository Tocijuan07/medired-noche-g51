-- db/schema.sql
SET NAMES utf8mb4; -- para que las tildes y ñ se guarden correctamente

DROP TABLE IF EXISTS pacientes;

CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  eps VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT INTO pacientes (nombre, documento, fecha_nacimiento, eps, telefono) VALUES
('Oscar Jimenez', '1001234567', '2004-10-28', 'comfenalco', '3154414635'),
('Ilana Urrea', '1007654321', '2006-05-09', 'comfandi', '3053124241'),
('Juan Damigo', '1009876543', '2005-07-09', 'sura', '3193378512');