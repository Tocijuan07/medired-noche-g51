-- =====================================================================
-- servidor1 · Una base de datos y un usuario por microservicio.
-- Cada usuario SOLO acepta conexiones desde servidor2 (10.0.0.243)
-- y SOLO tiene permisos sobre su propia base de datos.
--
-- Ejecutar en servidor1:  sudo mysql < crear-bases-y-usuarios.sql
-- ANTES cambie cada <clave> por una contraseña real (solo letras y números)
-- y NO suba al repositorio el archivo con las claves reales.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS usuarios_db CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'usuarios_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON usuarios_db.* TO 'usuarios_user'@'10.0.0.243';

CREATE DATABASE IF NOT EXISTS pacientes_db CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'pacientes_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON pacientes_db.* TO 'pacientes_user'@'10.0.0.243';

CREATE DATABASE IF NOT EXISTS medicos_db CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'medicos_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'10.0.0.243';

CREATE DATABASE IF NOT EXISTS citas_db CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'citas_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'10.0.0.243';

CREATE DATABASE IF NOT EXISTS historias_db CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'historias_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'10.0.0.243';

FLUSH PRIVILEGES;

-- Verificación
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user LIKE '%\_user';
