# ms-medicos · Taller 2 (Módulo 3)

Redes y Servicios Multimedia · UAO · MediRed IPS (grupo `medired-noche-g51`).

Microservicio que gestiona los **médicos y especialistas** de la clínica. Es un microservicio **consultado**: no guarda referencias a otros servicios, pero `ms-citas` y `ms-historias` le piden datos por REST.

- **Responsable:** Juan Diego Parra Patiño (`Tocijuan07`)
- **Puerto:** 3003
- **Base de datos propia:** `medicos_db` (MySQL), sin llaves foráneas

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior, MySQL 8 o MariaDB (XAMPP) y `ms-usuarios` corriendo para obtener tokens.

1. Crear la base de datos y su usuario (como root, en Workbench o en la consola `mysql -u root`):

```sql
CREATE DATABASE medicos_db;
CREATE USER 'medicos_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'localhost';
```

2. Crear la tabla y los registros iniciales con `db/schema.sql`:

```sql
USE medicos_db;
SOURCE db/schema.sql;
```

3. Instalar las dependencias: `npm install`
4. Copiar `.env.example` como `.env` (Windows: `copy .env.example .env`; Linux o Mac: `cp .env.example .env`) y ajustar los valores.
5. Arrancar: `npm run dev`. Debe imprimir `ms-medicos escuchando en http://127.0.0.1:3003`.

### Variables del `.env`

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servicio | `3003` |
| `HOST` | Dirección en la que escucha | `127.0.0.1` |
| `DB_HOST`, `DB_PORT` | Servidor MySQL | `127.0.0.1`, `3306` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base de datos y su usuario | `medicos_db`, `medicos_user`, la clave que usó en el `CREATE USER` |
| `JWT_SECRET` | Clave con la que se verifican los tokens. **Debe ser la misma en todos los microservicios del grupo** | la frase que acordó el grupo |

El archivo `.env` no se sube al repositorio.

## Representación y atributos

```json
{
  "id": 7,
  "nombre": "Carlos Pérez",
  "registro_medico": "RM-45821",
  "especialidad": "Pediatría",
  "sede": "Cali"
}
```

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | lo genera el servicio | no viene en el cuerpo de POST ni de PUT |
| `nombre` | texto (máx. 100) | sí | no vacío |
| `registro_medico` | texto (máx. 20) | sí | **único** (409 si ya existe) |
| `especialidad` | texto (máx. 100) | sí | no vacío |
| `sede` | texto | sí | `Bogotá`, `Cali` o `Medellín`. Se acepta sin tildes ni mayúsculas (`medellin`) y se guarda con su escritura oficial |

**Reglas de negocio:** no puede haber dos médicos con el mismo `registro_medico` (409 al crear y al actualizar) y la `sede` debe estar dentro de la lista (400).

## Endpoints

Todas las rutas, salvo `/health`, exigen la cabecera `Authorization: Bearer <token>` (token emitido por `ms-usuarios`). Sin token o con un token inválido responde 401; si el rol no tiene permiso, 403.

| Método | URI | Quién | Respuesta exitosa | Errores |
|---|---|---|---|---|
| GET | `/health` | Público | 200 | — |
| GET | `/medicos` | Cualquier rol autenticado | 200 arreglo (filtros `?especialidad=` y `?ids=`) | 400 ids inválidos · 401 |
| GET | `/medicos/:id` | Cualquier rol autenticado | 200 objeto | 400 id inválido · 401 · 404 |
| POST | `/medicos` | administrador | 201 objeto + cabecera `Location` | 400 · 401 · 403 · 409 |
| PUT | `/medicos/:id` | administrador | 200 objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| DELETE | `/medicos/:id` | administrador | 204 sin cuerpo | 400 · 401 · 403 · 404 |

- **Filtro por atributo:** `GET /medicos?especialidad=Pediatría` devuelve solo los médicos de esa especialidad.
- **Consulta por lotes:** `GET /medicos?ids=1,3` devuelve en una sola petición los médicos con esos ids. Los ids deben ser enteros positivos separados por coma.
- `PUT` reemplaza el registro completo: el cuerpo lleva todos los atributos, sin `id`.

### Ejemplo: crear

```
POST http://localhost:3003/medicos
Authorization: Bearer <token del administrador>
Content-Type: application/json

{ "nombre": "Dra. Laura Gómez", "registro_medico": "RM-45821", "especialidad": "Pediatría", "sede": "medellin" }
```

Respuesta `201 Created` (con `Location: /medicos/4`). La sede se guarda con su escritura oficial:

```json
{ "id": 4, "nombre": "Dra. Laura Gómez", "registro_medico": "RM-45821", "especialidad": "Pediatría", "sede": "Medellín" }
```

Datos inválidos: `400` con `{ "error": "Datos inválidos", "detalles": ["sede debe ser una de: Bogotá, Cali, Medellín"] }`. Registro repetido: `409`.

### Ejemplo: listar

```
GET http://localhost:3003/medicos?ids=1,3
Authorization: Bearer <token>
```

Respuesta `200 OK`:

```json
[
  { "id": 1, "nombre": "Dr. Juan Pérez", "registro_medico": "RM-10001", "especialidad": "Cardiología", "sede": "Bogotá" },
  { "id": 3, "nombre": "Dr. Carlos Rodríguez", "registro_medico": "RM-10003", "especialidad": "Pediatría", "sede": "Medellín" }
]
```

## Relaciones

`ms-medicos` **no guarda referencias** a otros microservicios. Es consultado por otros, y se compromete a mantener lo siguiente:

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| `ms-citas` | `GET /medicos/:id` · `GET /medicos?ids=…` | `id`, `nombre`, `especialidad` |
| `ms-historias` | `GET /medicos/:id` · `GET /medicos?ids=…` | `id`, `nombre`, `especialidad` |

En la terminal donde corre este servicio se ve cada petición que recibe (hora, método y URI), incluidas las de los otros microservicios.
