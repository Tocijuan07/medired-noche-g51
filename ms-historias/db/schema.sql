-- db/schema.sql
SET NAMES utf8mb4; -- para que las tildes y ñ se guarden correctamente

DROP TABLE IF EXISTS historias;

-- Sin llaves foráneas: paciente_id y medico_id viven en las bases de ms-pacientes y ms-medicos
CREATE TABLE historias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  fecha DATE NOT NULL,
  motivo_consulta VARCHAR(255) NOT NULL,
  diagnostico VARCHAR(255) NOT NULL,
  tratamiento TEXT NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT INTO historias (paciente_id, medico_id, fecha, motivo_consulta, diagnostico, tratamiento) VALUES
(1, 1, '2026-11-09', 'Dolor de cabeza', 'Cefalea tensional', 'Reposo, hidratación y analgesia'),
(2, 2, '2026-11-10', 'Fiebre y tos', 'Infección respiratoria', 'Reposo e hidratación'),
(3, 3, '2026-11-11', 'Dolor abdominal', 'Gastritis', 'Dieta blanda y medicación para la acidez');