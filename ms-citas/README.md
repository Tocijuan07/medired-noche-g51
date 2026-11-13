# ms-citas · Microservicio de citas médicas (MediRed IPS)

Microservicio **individual** del grupo G51 — Redes y Servicios Multimedia, Módulo 3 (Taller 2).

Gestiona las **citas médicas** de la clínica: agenda a un paciente con un médico en una fecha, sede y estado. Escucha en el puerto **3004**.

- **Responsable:** Grupo G51 — Redes y Servicios Multimedia, Módulo 3
- **Puerto:** 3004 (`http://127.0.0.1:3004`)
- **Base de datos:** `citas_db` (MySQL 8, usuario dedicado `citas_user`)
- **Seguridad:** tokens JWT (misma `JWT_SECRET` en todos los microservicios del grupo)

## Cómo ejecutarlo

Requisitos: Node.js LTS 22+, MySQL 8 corriendo en local.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos y el usuario (como administrador/root)
mysql -u root -p
```

```sql
CREATE DATABASE citas_db DEFAULT CHARSET utf8mb4;
CREATE USER 'citas_user'@'localhost' IDENTIFIED BY 'citas-clave-2026';
GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'localhost';
FLUSH PRIVILEGES;
```

```bash
# 3. Cargar la tabla y los registros iniciales
mysql -u citas_user -p citas_db < db/schema.sql

# 4. Crear el archivo de configuración
copy .env.example .env        # Windows (Linux/Mac: cp .env.example .env)
#    Edite .env: JWT_SECRET (la frase del grupo) y las URLs de
#    PACIENTES_URL / MEDICOS_URL si los demás servicios están en otro puerto.

# 5. Arrancar
npm run dev
```

Verificación: `GET http://localhost:3004/health` → `{"servicio":"ms-citas","estado":"ok"}`

### Variables del `.env`

| Variable | Ejemplo | Descripción |
|---|---|---|
| PORT / HOST | 3004 / 127.0.0.1 | Dónde escucha el microservicio |
| SEDES | Bogotá,Cali,Medellín | Sedes válidas de una cita |
| ESTADOS | programada,atendida,cancelada | Estados válidos de una cita |
| DB_HOST / DB_PORT | 127.0.0.1 / 3306 | Servidor MySQL |
| DB_NAME / DB_USER / DB_PASSWORD | citas_db / citas_user / … | Base y usuario dedicados |
| JWT_SECRET | frase-larga-del-grupo | Clave para firmar/verificar los tokens |
| PACIENTES_URL | http://127.0.0.1:3002 | URL de ms-pacientes |
| MEDICOS_URL | http://127.0.0.1:3003 | URL de ms-medicos |

> Nunca suba el `.env` al repositorio (está en `.gitignore`): contiene la contraseña de la base y la clave JWT.

## Representación y atributos

Ejemplo de registro:

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha_hora": "2027-11-10T09:00",
  "sede": "Bogotá",
  "estado": "programada"
}
```

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| id | entero | — | Lo genera MySQL (AUTO_INCREMENT) |
| paciente_id | entero | Sí | Entero positivo. Debe existir en ms-pacientes (validado al crear/actualizar) |
| medico_id | entero | Sí | Entero positivo. Debe existir en ms-medicos (validado al crear/actualizar) |
| fecha_hora | texto | Sí | Formato `AAAA-MM-DDTHH:MM`; debe estar en el futuro |
| sede | texto | Sí | Una de las de `SEDES` del `.env` |
| estado | texto | No | Uno de los de `ESTADOS`; por defecto `programada` |

**Reglas de negocio (capa de servicio):**

1. **409** — un mismo médico no puede tener dos citas en la misma `fecha_hora`.
2. **400** — `fecha_hora` debe ser futura; `estado` y `sede` deben estar en sus listas.

## Endpoints

Todas las rutas (excepto `/health`) exigen la cabecera `Authorization: Bearer <token>`.
Cualquier rol autenticado **consulta**; solo `administrador` y `admisiones` **crean, modifican y eliminan**.

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Listar | GET | /citas | — | 200 + arreglo | 401 |
| Filtrar | GET | /citas?sede=Bogotá | — | 200 + arreglo filtrado | 401 |
| Obtener | GET | /citas/:id | — | 200 + objeto | 400 · 401 · 404 |
| Crear | POST | /citas | JSON sin id | 201 + objeto + cabecera Location | 400 · 401 · 403 · 409 · 503 |
| Actualizar | PUT | /citas/:id | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 · 503 |
| Eliminar | DELETE | /citas/:id | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Filtros combinables en el listado: `?sede=`, `?estado=`, `?medico_id=`, `?paciente_id=`.

### Ejemplo: crear una cita

```http
POST /citas
Authorization: Bearer <token>
Content-Type: application/json

{
  "paciente_id": 1,
  "medico_id": 2,
  "fecha_hora": "2027-12-01T10:00",
  "sede": "Cali",
  "estado": "programada"
}
```

Respuesta `201`:

```json
{
  "id": 7,
  "paciente_id": 1,
  "medico_id": 2,
  "fecha_hora": "2027-12-01T10:00",
  "sede": "Cali",
  "estado": "programada",
  "paciente": { "id": 1, "nombre": "Oscar Jimenez", "documento": "1001234567", "eps": "comfenalco" },
  "medico": { "id": 2, "nombre": "Dra. María Gómez", "especialidad": "Neurología", "sede": "Cali" }
}
```

### Ejemplo: listar

```http
GET /citas?sede=Bogotá
Authorization: Bearer <token>
```

Respuesta `200`: arreglo de citas, cada una con los objetos `paciente` y `medico` incluidos.

## Relaciones

ms-citas **guarda referencias** a dos microservicios: valida su existencia al escribir y compone sus datos al leer.

### Lado de ms-citas (quien guarda la referencia)

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| paciente_id | ms-pacientes (3002) | `GET /pacientes/:id` → si no existe: 400; si no responde: 503 | `GET /pacientes?ids=…` (UNA petición para todas) | id, nombre, documento, eps |
| medico_id | ms-medicos (3003) | `GET /medicos/:id` → si no existe: 400; si no responde: 503 | `GET /medicos?ids=…` (UNA petición para todas) | id, nombre, especialidad, sede |

- **Al escribir (validación):** POST y PUT verifican que el paciente y el médico existan. Si el otro microservicio no responde en 3 segundos → **503**.
- **Al leer (composición):** GET por id y GET del listado agregan los objetos `paciente` y `medico` con una sola consulta por lotes a cada servicio. Si un servicio no responde, la respuesta sale igual (**200**) con ese objeto en `null` y un campo `aviso`: la aplicación funciona a medias en lugar de caerse.

Los clientes HTTP viven en `src/clients/` (pacientes.client.js y medicos.client.js) y reenvían el token recibido.

### Lado de ms-pacientes y ms-medicos (los consultados)

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| ms-citas | `GET /pacientes/:id` · `GET /pacientes?ids=…` | id, nombre, documento, eps |
| ms-citas | `GET /medicos/:id` · `GET /medicos?ids=…` | id, nombre, especialidad, sede |

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/citas.routes.js | Presentación | Método HTTP + URI → controlador, con permisos por rol |
| src/controllers/citas.controller.js | Presentación | Lee la petición, pasa el token al servicio, arma la respuesta |
| src/services/citas.service.js | Lógica de negocio | Validaciones, reglas (409/400), validación y composición de referencias |
| src/repositories/citas.repository.js | Acceso a datos | Consultas SQL parametrizadas (sin concatenar valores) |
| src/db.js | Acceso a datos | Pool de conexiones a MySQL con los datos del `.env` |
| src/models/cita.js | Modelo | Atributos de la entidad y su validación |
| src/middlewares/auth.js | Seguridad | verificarToken (401) y requiereRol (403) |
| src/clients/*.js | Integración | Clientes HTTP de ms-pacientes y ms-medicos |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |
| db/schema.sql | Datos | Estructura de la tabla y registros iniciales |
