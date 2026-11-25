-- db/schema.sql · ms-citas
-- Se ejecuta en servidor1, dentro de citas_db:
--   sudo mysql citas_db < db/schema.sql
SET NAMES utf8mb4; -- para que las tildes y ñ se guarden correctamente

DROP TABLE IF EXISTS citas;

-- Sin llaves foráneas: paciente_id y medico_id viven en las bases de ms-pacientes y ms-medicos.
-- La tabla NO guarda el nombre del paciente ni del médico (eso se pide por REST al leer).
CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  sede VARCHAR(30) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programada'
) DEFAULT CHARSET = utf8mb4;

INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES
(1, 1, '2026-11-26 08:00:00', 'Bogotá', 'programada'),
(2, 2, '2026-11-26 09:30:00', 'Cali', 'programada'),
(3, 3, '2026-11-27 10:00:00', 'Medellín', 'programada'),
(1, 2, '2026-11-20 14:00:00', 'Cali', 'atendida');
