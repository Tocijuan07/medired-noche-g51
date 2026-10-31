# ms-citas · Taller 1 (Módulo 3)

Microservicio de **citas médicas** de MediRed IPS, con **Node.js + Express** organizado en capas.
Datos en memoria; en el Taller 2 se conectará a MySQL.

Guarda `paciente_id` y `medico_id` como referencias a `ms-pacientes` y `ms-medicos`. En esta versión solo se valida el formato de esos ids.

## Cómo ejecutarlo

Requisitos: Node.js LTS 22 o superior (`node -v`).

```
npm install
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev
```

Prueben en el navegador: http://localhost:3004/health y http://localhost:3004/citas

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/citas.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/citas.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/citas.service.js | Lógica de negocio | Validaciones y regla de no solapar citas del mismo médico |
| src/repositories/citas.repository.js | Acceso a datos | Guarda y consulta (en memoria) |
| src/models/cita.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints (Taller 1)

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-citas","estado":"ok"}` |
| GET | /citas | 200 arreglo de citas |
| GET | /citas/:id | 200 cita · 400 id inválido · 404 no existe |
| POST | /citas | 201 cita creada · 400 datos inválidos · 409 médico ocupado en esa fecha_hora |

Ejemplo de cuerpo para POST:
`{"paciente_id": 1, "medico_id": 1, "fecha_hora": "2026-11-12T08:30", "sede": "Bogotá", "estado": "programada"}`

Las sedes válidas se configuran en `.env` (`SEDES=Bogotá,Cali,Medellín`).
Los estados válidos se configuran en `.env` (`ESTADOS=programada,atendida,cancelada`). Si no se envía `estado`, se asume `programada`.
