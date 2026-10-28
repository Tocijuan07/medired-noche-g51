# ms-pacientes · Taller 1 (Módulo 3)

Microservicio de **pacientes** de MediRed IPS, con **Node.js + Express** organizado en capas.
Datos en memoria; en el Taller 2 se conectará a MySQL.

## Cómo ejecutarlo

```
npm install
copy .env.example .env      # en Linux/Mac: cp .env.example .env
npm run dev
```

Prueben en el navegador: http://localhost:3002/health y http://localhost:3002/pacientes

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/pacientes.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/pacientes.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/pacientes.service.js | Lógica de negocio | Validaciones y regla de documento único |
| src/repositories/pacientes.repository.js | Acceso a datos | Guarda y consulta (en memoria) |
| src/models/paciente.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-pacientes","estado":"ok"}` |
| GET | /pacientes | 200 arreglo de pacientes |
| GET | /pacientes/:id | 200 paciente · 400 id inválido · 404 no existe |
| POST | /pacientes | 201 paciente creado · 400 datos inválidos · 409 documento repetido |

Ejemplo de cuerpo para POST:
`{"nombre": "Marta Ríos", "documento": "1012345678", "fecha_nacimiento": "2003-03-15", "eps": "Nueva EPS", "telefono": "3001234567"}`
