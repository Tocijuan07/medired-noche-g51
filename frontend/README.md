# Frontend · MediRed IPS

Interfaz web de MediRed IPS (HTML, CSS y JavaScript, sin framework). Se sirve desde **servidor2** con Apache y llama a la API **a través del gateway**: todas las peticiones van a rutas relativas `/api/<recurso>`, sin nombre de servidor ni puerto, y por eso no necesita CORS.

Adaptado del ejemplo de la docente (frontend de «Usuarios») a las cinco entidades de MediRed y a los tres roles: `administrador`, `admisiones` y `medico`.

## Cómo usarlo

1. Abrir `http://app.medired.com` en el navegador de Windows (Apache entrega `login.html`).
2. Iniciar sesión. El sistema lleva a cada usuario a la página de su rol:

| Rol | Página de inicio | Menú |
|---|---|---|
| administrador | `admin.html` (Panel general) | Panel general · Pacientes · Médicos · Citas · Historias clínicas · Mi perfil |
| admisiones | `citas.html` (Agenda de citas) | Agenda de citas · Pacientes · Médicos · Mi perfil |
| medico | `citas.html` (Citas del día) | Citas del día · Historias clínicas · Pacientes · Mi perfil |

## Publicarlo en servidor2

```bash
cd /srv/medired/app && git pull
sudo cp -r frontend/* /var/www/app/
```

El host virtual `app.conf` tiene `DocumentRoot /var/www/app` y `DirectoryIndex login.html index.html`.
Si el navegador tiene configurado el proxy Squid, agregar `*.medired.com` a las excepciones.

## Estructura

| Archivo | Qué hace |
|---|---|
| `login.html` + `js/login.js` | Inicio de sesión; lleva a cada usuario a la página de su rol |
| `admin.html` + `js/admin.js` | Totales (pacientes, médicos, citas, historias) y usuarios: crear, editar y eliminar |
| `pacientes.html` + `js/pacientes.js` | Pacientes: listar, buscar, crear, editar, eliminar |
| `medicos.html` + `js/medicos.js` | Médicos: listar, buscar, crear, editar, eliminar |
| `citas.html` + `js/citas.js` | Citas con paciente y médico ya compuestos por el backend; crear, editar, cancelar, eliminar |
| `historias.html` + `js/historias.js` | Historias clínicas con paciente y médico compuestos; crear, editar, eliminar |
| `perfil.html` + `js/perfil.js` | Los datos del usuario que inició sesión |
| `js/config.js` | Ruta de la API (`/api`), roles, sedes, estados, permisos y menú de cada rol |
| `js/api.js` | **Todas** las llamadas a la API: agrega el token y convierte los errores en mensajes |
| `js/sesion.js` | Login, usuario actual, cierre de sesión, control de acceso y encabezado |
| `js/ui.js` | Mensajes, avisos, formato de fechas y formularios en cuadro de diálogo |
| `css/estilos.css` | Estilos (sin fuentes externas) |

## Peticiones que hace cada pantalla

| Pantalla | Petición | Quién puede escribir |
|---|---|---|
| Login | `POST /api/usuarios/login` | — |
| Mi perfil | `GET /api/usuarios/me` | — |
| Panel general | `GET /api/pacientes`, `/api/medicos`, `/api/citas`, `/api/historias` (totales) · `GET/POST/PUT/DELETE /api/usuarios` | administrador |
| Pacientes | `GET/POST/PUT/DELETE /api/pacientes` | administrador, admisiones |
| Médicos | `GET/POST/PUT/DELETE /api/medicos` | administrador |
| Citas | `GET/POST/PUT/DELETE /api/citas` | administrador, admisiones |
| Historias clínicas | `GET/POST/PUT/DELETE /api/historias` (`?paciente_id=` desde «Citas del día») | administrador, medico |

Los formularios de citas e historias piden también `GET /api/pacientes` y `GET /api/medicos` para llenar las listas desplegables de paciente y médico. Si ese microservicio no responde, el formulario pasa a pedir el id escrito.

## Cómo maneja los errores

Todos los mensajes salen de `api()` y de `mostrarError()`:

| Código | Qué ve el usuario |
|---|---|
| 400 | El mensaje del microservicio y la lista de `detalles` |
| 401 | Se borra la sesión y vuelve al login (en el login: «Email o contraseña incorrectos») |
| 403 | «El rol … no tiene permiso para esta operación» (los botones ya están ocultos, pero la protección real es del microservicio) |
| 409 | El mensaje de la regla de negocio (documento repetido, médico ocupado…) |
| 503 | «ms-… no está disponible» (lo genera el microservicio que consulta) o, si Apache responde con su página HTML, un mensaje genérico de servicio no disponible |
| 500 | «Error interno del servidor» (el detalle queda solo en la consola del navegador) |
| sin respuesta | «No hay conexión con el servidor» |

En las pantallas con relaciones (citas, historias), si el backend responde `paciente: null` o `medico: null` con un `aviso`, la pantalla muestra una franja amarilla con el aviso y «No disponible» en esa celda, sin caerse.

## Decisiones de diseño

- **El frontend no une datos.** El nombre del paciente y del médico de cada cita o historia llegan dentro de la respuesta de ms-citas / ms-historias (una petición por recurso, comprobable en la pestaña Red de F12).
- **Ocultar un botón no es seguridad.** `config.js` solo decide qué botones se muestran; si se pide la operación, el microservicio responde 403 y la pantalla lo muestra.
- **El token vive en `sessionStorage`:** se borra al cerrar la pestaña.
- **Texto siempre escapado** (`esc()`) antes de ponerlo en el HTML.
- **Sin fuentes ni librerías externas:** la aplicación funciona aunque el navegador no tenga Internet.
