# ms-historias · Plantilla del Taller 1 (Módulo 3)

Microservicio de **historias** de MediRed IPS, con **Node.js + Express** organizado en capas.

Esta es la versión del Taller 1: datos en memoria y tres operaciones. La versión completa (MySQL, contraseña cifrada, inicio de sesión y tokens JWT) se entrega en el Taller 3.

## Cómo ejecutarlo

```
npm install                 # descarga Express en node_modules
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev                 # inicia y se reinicia solo al guardar cambios
```

Probar en el navegador: http://localhost:3005/health y http://localhost:3005/historias

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/historias.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/historias.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/historias.service.js | Lógica de negocio | Validaciones y reglas (email único); no conoce HTTP ni la base de datos |
| src/repositories/historias.repository.js | Acceso a datos | Guarda y consulta (en memoria en el Taller 1) |
| src/models/historia.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints (Taller 1)

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-historias","estado":"ok"}` |
| GET | /historias | 200 arreglo de historias |
| GET | /historias/:id | 200 historia · 400 id inválido · 404 no existe |
| POST | /historias | 201 historia creado · 400 datos inválidos · 409 email repetido |

Ejemplo de cuerpo para POST:
`{"paciente_id": "4", "medico_id": "6", "fecha": "2003-03-15", "motivo_consulta": "Dolor abdominal agudo", "diagnostico": "Úlcera péptica perforada", "tratamiento": "Sutura simple y epiploplastia", "medicamento_id": "1234" }`
