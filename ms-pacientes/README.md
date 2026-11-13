# ms-pacientes · Taller 2 (Módulo 3)

Redes y Servicios Multimedia · UAO · MediRed IPS (grupo `medired-noche-g51`).

Microservicio que gestiona los **pacientes** de la clínica. Es un microservicio **consultado**: no guarda referencias a otros servicios, pero `ms-citas` y `ms-historias` le piden datos por REST.

- **Responsable:** Juan Diego Parra Patiño (`Tocijuan07`)
- **Puerto:** 3002
- **Base de datos propia:** `pacientes_db` (MySQL), sin llaves foráneas

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior, MySQL 8 o MariaDB (XAMPP) y `ms-usuarios` corriendo para obtener tokens.

1. Crear la base de datos y su usuario (como root, en Workbench o en la consola `mysql -u root`):

```sql
CREATE DATABASE pacientes_db;
CREATE USER 'pacientes_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON pacientes_db.* TO 'pacientes_user'@'localhost';
```

2. Crear la tabla y los registros iniciales con `db/schema.sql`:

```sql
USE pacientes_db;
SOURCE db/schema.sql;
```

3. Instalar las dependencias: `npm install`
4. Copiar `.env.example` como `.env` (Windows: `copy .env.example .env`; Linux o Mac: `cp .env.example .env`) y ajustar los valores.
5. Arrancar: `npm run dev`. Debe imprimir `ms-pacientes escuchando en http://127.0.0.1:3002`.

### Variables del `.env`

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servicio | `3002` |
| `HOST` | Dirección en la que escucha | `127.0.0.1` |
| `DB_HOST`, `DB_PORT` | Servidor MySQL | `127.0.0.1`, `3306` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base de datos y su usuario | `pacientes_db`, `pacientes_user`, la clave que usó en el `CREATE USER` |
| `JWT_SECRET` | Clave con la que se verifican los tokens. **Debe ser la misma en todos los microservicios del grupo** | la frase que acordó el grupo |

El archivo `.env` no se sube al repositorio.

## Representación y atributos

```json
{
  "id": 3,
  "nombre": "Ana Ruiz",
  "documento": "1001234567",
  "fecha_nacimiento": "1998-04-12",
  "eps": "Sura",
  "telefono": "3001112233"
}
```

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | lo genera el servicio | no viene en el cuerpo de POST ni de PUT |
| `nombre` | texto (máx. 100) | sí | no vacío |
| `documento` | texto (máx. 20) | sí | **único** (409 si ya existe) |
| `fecha_nacimiento` | fecha `AAAA-MM-DD` | sí | formato válido |
| `eps` | texto (máx. 100) | sí | no vacío |
| `telefono` | texto (máx. 20) | sí | no vacío |

**Regla de negocio:** no puede haber dos pacientes con el mismo `documento` (409 al crear y al actualizar).

## Endpoints

Todas las rutas, salvo `/health`, exigen la cabecera `Authorization: Bearer <token>` (token emitido por `ms-usuarios`). Sin token o con un token inválido responde 401; si el rol no tiene permiso, 403.

| Método | URI | Quién | Respuesta exitosa | Errores |
|---|---|---|---|---|
| GET | `/health` | Público | 200 | — |
| GET | `/pacientes` | Cualquier rol autenticado | 200 arreglo (filtros `?eps=` y `?ids=`) | 400 ids inválidos · 401 |
| GET | `/pacientes/:id` | Cualquier rol autenticado | 200 objeto | 400 id inválido · 401 · 404 |
| POST | `/pacientes` | administrador, admisiones | 201 objeto + cabecera `Location` | 400 · 401 · 403 · 409 |
| PUT | `/pacientes/:id` | administrador, admisiones | 200 objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| DELETE | `/pacientes/:id` | administrador, admisiones | 204 sin cuerpo | 400 · 401 · 403 · 404 |

- **Filtro por atributo:** `GET /pacientes?eps=sura` devuelve solo los pacientes de esa EPS.
- **Consulta por lotes:** `GET /pacientes?ids=1,3,8` devuelve en una sola petición los pacientes con esos ids. Los ids deben ser enteros positivos separados por coma.
- `PUT` reemplaza el registro completo: el cuerpo lleva todos los atributos, sin `id`.

### Ejemplo: crear

```
POST http://localhost:3002/pacientes
Authorization: Bearer <token>
Content-Type: application/json

{ "nombre": "Marta Ríos", "documento": "1012345678", "fecha_nacimiento": "2003-03-15", "eps": "Nueva EPS", "telefono": "3001234567" }
```

Respuesta `201 Created` (con `Location: /pacientes/4`):

```json
{ "id": 4, "nombre": "Marta Ríos", "documento": "1012345678", "fecha_nacimiento": "2003-03-15", "eps": "Nueva EPS", "telefono": "3001234567" }
```

Datos inválidos: `400` con `{ "error": "Datos inválidos", "detalles": ["eps es obligatoria"] }`. Documento repetido: `409`.

### Ejemplo: listar

```
GET http://localhost:3002/pacientes?ids=1,3
Authorization: Bearer <token>
```

Respuesta `200 OK`:

```json
[
  { "id": 1, "nombre": "Oscar Jimenez", "documento": "1001234567", "fecha_nacimiento": "2004-10-28", "eps": "comfenalco", "telefono": "3154414635" },
  { "id": 3, "nombre": "Juan Damigo", "documento": "1009876543", "fecha_nacimiento": "2005-07-09", "eps": "sura", "telefono": "3193378512" }
]
```

## Relaciones

`ms-pacientes` **no guarda referencias** a otros microservicios. Es consultado por otros, y se compromete a mantener lo siguiente:

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| `ms-citas` | `GET /pacientes/:id` · `GET /pacientes?ids=…` | `id`, `nombre` |
| `ms-historias` | `GET /pacientes/:id` · `GET /pacientes?ids=…` | `id`, `nombre` |

En la terminal donde corre este servicio se ve cada petición que recibe (hora, método y URI), incluidas las de los otros microservicios.
