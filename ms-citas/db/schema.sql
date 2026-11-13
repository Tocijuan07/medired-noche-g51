-- db/schema.sql — base de datos del microservicio ms-citas
SET NAMES utf8mb4; -- para que las tildes y la ñ se guarden bien

DROP TABLE IF EXISTS citas;

CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,           -- referencia a ms-pacientes (sin FOREIGN KEY: vive en otra base)
  medico_id INT NOT NULL,             -- referencia a ms-medicos (sin FOREIGN KEY: vive en otra base)
  fecha_hora VARCHAR(16) NOT NULL,    -- formato AAAA-MM-DDTHH:MM
  sede VARCHAR(50) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programada'
) DEFAULT CHARSET = utf8mb4;

-- Registros iniciales de ejemplo
INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES
(1, 1, '2027-11-10T09:00', 'Bogotá', 'programada'),
(2, 2, '2027-11-10T10:30', 'Cali', 'atendida'),
(3, 3, '2027-11-11T14:00', 'Medellín', 'cancelada');
