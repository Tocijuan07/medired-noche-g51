# MediRed IPS · Jornada noche · Grupo 51

Aplicación web de **MediRed IPS** (clínica y servicios de salud) que gestiona pacientes, médicos, citas e historias clínicas mediante microservicios REST en Node.js + Express, organizados en capas. Proyecto del Módulo 3 de Redes y Servicios Multimedia (UAO). Todos los datos son ficticios.

Repositorio: `medired-noche-g51`

## Integrantes

| Integrante | Usuario de GitHub | Microservicio a cargo |
|---|---|---|
| Juan Diego Parra Patiño | Tocijuan07 | ms-pacientes |
| Juan Diego Parra Patiño | Tocijuan07 | ms-medicos |
| Fabian Esteban Lopez Arias | Fabianlopezar | ms-citas |
| Juan Camilo Salgado Baldión | Trolkerberg | ms-historias |

## Microservicios

| Carpeta | Entidad | Responsable | Puerto | Depende de |
|---|---|---|---|---|
| `ms-usuarios` | Usuarios (inicio de sesión y roles) | Docente | 3001 | — |
| `ms-pacientes` | Pacientes de la clínica | Juan Diego Parra | 3002 | — |
| `ms-medicos` | Médicos y especialistas | Juan Diego Parra | 3003 | — |
| `ms-citas` | Citas médicas | Fabian Esteban Lopez Arias | 3004 | ms-pacientes, ms-medicos |
| `ms-historias` | Registros de la historia clínica | Juan Camilo Salgado Baldión | 3005 | ms-pacientes, ms-medicos (y ms-medicamentos en grupos de 5) |
Cada microservicio es dueño exclusivo de sus datos: las relaciones entre ellos se guardan como un id (por ejemplo `paciente_id`) y se consultan por REST.

## Estructura del repositorio

```
medired-noche-g51/
├── README.md          ← este archivo
├── ms-usuarios/       ← entregado por la docente (no se modifica)
├── ms-pacientes/      ← microservicio de pacientes
├── ms-medicos/        ← microservicio de médicos
├── ms-citas/          ← microservicio de citas
├── ms-historias/      ← microservicio de historias clínicas
├── frontend/          ← interfaz web (desde la semana 2)
└── deploy/            ← archivos de despliegue (Taller 3)
```

Dentro de cada microservicio:

```
ms-<recurso>/
├── .env.example       ← variables de entorno (PORT, HOST)
├── package.json
└── src/
    ├── index.js       ← arranque del servidor
    ├── app.js         ← middlewares, /health, rutas y manejo de errores
    ├── routes/        ← método HTTP + URI → controlador
    ├── controllers/   ← petición y respuesta HTTP
    ├── services/      ← lógica de negocio y validaciones
    ├── repositories/  ← acceso a datos (en memoria en el Taller 1)
    ├── models/        ← atributos de la entidad y su validación
    └── utils/         ← utilidades (HttpError)
```

## Cómo ejecutar un microservicio

Requiere Node.js 22 o superior. Desde la carpeta del microservicio (por ejemplo `ms-pacientes`):

```
cd ms-pacientes
npm install
copy .env.example .env      # en Linux o Mac: cp .env.example .env
npm run dev
```

Luego abre `http://localhost:<puerto>/health` (por ejemplo `http://localhost:3002/health`). El archivo `.env` y la carpeta `node_modules` no se suben al repositorio.
