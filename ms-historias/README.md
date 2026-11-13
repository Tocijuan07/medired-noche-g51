# ms-historias · MediRed IPS

Microservicio de la entidad **Historia clínica** de MediRed IPS (Redes y Servicios Multimedia, Módulo 3).

- **Responsable:** Juan Camilo Salgado Baldión (GitHub: Trolkerberg)
- **Puerto:** 3005
- **Tecnología:** Node.js + Express, MySQL, tokens JWT

Cada historia guarda el `paciente_id` y el `medico_id` de la atención. Los datos del paciente y del médico **no se guardan aquí**: viven en ms-pacientes y ms-medicos, y este servicio los consulta por REST para validar y para componer sus respuestas.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior y MySQL 8 (o MariaDB de XAMPP). Para las relaciones deben estar corriendo también ms-usuarios (3001), ms-pacientes (3002) y ms-medicos (3003).

1. Crear la base de datos y su usuario (como root):

   ```sql
   CREATE DATABASE historias_db;
   CREATE USER 'historias_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
   GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'localhost';
   ```

2. Crear la tabla y los datos iniciales con `db/schema.sql`:

   ```
   mysql -u historias_user -p historias_db
   mysql> SOURCE db/schema.sql;
   ```

3. `npm install`
4. Copiar `.env.example` como `.env` y ajustar los valores:

   | Variable | Para qué sirve |
   |---|---|
   | `PORT`, `HOST` | Puerto (3005) y dirección donde escucha |
   | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a `historias_db` |
   | `JWT_SECRET` | La misma clave del grupo con la que ms-usuarios firma los tokens |
   | `PACIENTES_URL` | Dirección de ms-pacientes (`http://127.0.0.1:3002`) |
   | `MEDICOS_URL` | Dirección de ms-medicos (`http://127.0.0.1:3003`) |

5. `npm run dev`. En la terminal se registra cada petición que llega (hora, método y URI).

## Representación

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha": "2026-11-09",
  "motivo_consulta": "Dolor de cabeza",
  "diagnostico": "Cefalea tensional",
  "tratamiento": "Reposo, hidratación y analgesia",
  "paciente": { "id": 1, "nombre": "Oscar Jimenez" },
  "medico": { "id": 1, "nombre": "Dr. Juan Pérez", "especialidad": "Cardiología" }
}
```

`paciente` y `medico` no se guardan: los compone el servicio en cada consulta. Si ms-pacientes o ms-medicos no responden, salen en `null` y la respuesta trae un campo `aviso`.

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | — | Lo genera MySQL |
| `paciente_id` | entero | Sí | Entero positivo; debe existir en ms-pacientes (si no, 400) |
| `medico_id` | entero | Sí | Entero positivo; debe existir en ms-medicos (si no, 400) |
| `fecha` | fecha `AAAA-MM-DD` | Sí | Fecha real y **no futura** (400) |
| `motivo_consulta` | texto | Sí | No vacío |
| `diagnostico` | texto | Sí | No vacío |
| `tratamiento` | texto | Sí | No vacío |

**Regla de negocio (409):** no puede repetirse la misma atención, es decir, el mismo paciente con el mismo médico en la misma fecha. Un paciente sí puede tener varias historias.

## Endpoints

Todas las rutas exigen la cabecera `Authorization: Bearer <token>` (sin token o con token inválido: 401). Consultan todos los roles; crean, modifican y eliminan solo `administrador` y `medico` (los demás: 403).

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores |
|---|---|---|---|---|---|
| Listar | GET | /historias | — | 200 + arreglo compuesto | 401 |
| Filtrar | GET | /historias?paciente_id=1 · /historias?fecha=2026-11-09 | — | 200 + arreglo filtrado | 400 paciente_id inválido · 401 |
| Obtener | GET | /historias/:id | — | 200 + historia compuesta | 400 · 401 · 404 |
| Crear | POST | /historias | JSON sin id | 201 + historia + cabecera Location | 400 · 401 · 403 · 409 · 503 |
| Actualizar | PUT | /historias/:id | JSON completo sin id | 200 + historia | 400 · 401 · 403 · 404 · 409 · 503 |
| Eliminar | DELETE | /historias/:id | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

No ofrece `?ids=` porque ningún otro microservicio consulta a ms-historias.

### Ejemplo: crear

```
POST /historias
Authorization: Bearer <token de administrador o medico>
Content-Type: application/json

{ "paciente_id": 2, "medico_id": 3, "fecha": "2026-11-12",
  "motivo_consulta": "Control", "diagnostico": "Sin hallazgos", "tratamiento": "Seguimiento anual" }
```

Respuesta `201 Created` (cabecera `Location: /historias/4`):

```json
{ "id": 4, "paciente_id": 2, "medico_id": 3, "fecha": "2026-11-12",
  "motivo_consulta": "Control", "diagnostico": "Sin hallazgos", "tratamiento": "Seguimiento anual",
  "paciente": { "id": 2, "nombre": "Ilana Urrea" },
  "medico": { "id": 3, "nombre": "Dr. Carlos Rodríguez", "especialidad": "Pediatría" } }
```

### Ejemplo: listar

`GET /historias` responde `200` con un arreglo de historias como la de la sección *Representación*. Para componerlo, el servicio hace **una sola** petición `?ids=` a cada microservicio, sin importar cuántas historias haya.

## Relaciones

`ms-historias` **guarda referencias** a dos microservicios y los consulta por REST, reenviando el token que recibió:

| Atributo | Microservicio consultado | Para validar (POST y PUT) | Para componer (GET) | Datos que usa |
|---|---|---|---|---|
| `paciente_id` | ms-pacientes | `GET /pacientes/:id` | `GET /pacientes?ids=...` | id, nombre |
| `medico_id` | ms-medicos | `GET /medicos/:id` | `GET /medicos?ids=...` | id, nombre, especialidad |

- Si el id referenciado no existe: **400**.
- Si el otro microservicio no responde al escribir (timeout de 3 s): **503**.
- Si no responde al leer: **200** con el objeto en `null` y un `aviso` (degradación controlada).

Ningún microservicio consulta a ms-historias.