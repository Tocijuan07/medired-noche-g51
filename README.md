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

# Despliegue de MediRed IPS (Taller 3 · Módulo 3)

Esta guía explica, paso a paso, cómo desplegar la aplicación en el ambiente del Módulo 2 (dos máquinas virtuales). Es la sección de despliegue del README del grupo `medired-noche-g51`.

> **Contraseñas:** en este documento y en el repositorio no hay contraseñas. Donde aparece `<clave>`, use una contraseña nueva solo con letras y números. El archivo `.env` nunca se sube a GitHub (está en `.gitignore`); solo se sube `.env.example`.

## 1. Arquitectura

| Componente | Equipo | IP | Puerto | Accesible desde |
|---|---|---|---|---|
| DNS (bind9) | servidor1 | 10.0.0.242 | 53 | red del laboratorio |
| MySQL | servidor1 | 10.0.0.242 | 3306 | solo servidor2 (10.0.0.243) |
| Apache (gateway + frontend) | servidor2 | 10.0.0.243 | 80 | navegador del anfitrión Windows |
| ms-usuarios | servidor2 | 127.0.0.1 | 3001 | solo servidor2 |
| ms-pacientes | servidor2 | 127.0.0.1 | 3002 | solo servidor2 |
| ms-medicos | servidor2 | 127.0.0.1 | 3003 | solo servidor2 |
| ms-citas | servidor2 | 127.0.0.1 | 3004 | solo servidor2 |
| ms-historias | servidor2 | 127.0.0.1 | 3005 | solo servidor2 |

Flujo: el navegador consulta el DNS (servidor1) → abre `http://app.medired.com` en Apache (servidor2) → Apache sirve el frontend y reenvía `/api/<recurso>` al microservicio correspondiente → cada microservicio verifica el token y usa su propia base de datos en servidor1.

En servidor2 solo están abiertos `22/tcp` y `80/tcp` en `ufw`. Los puertos 3001 a 3006 **no** se abren.

## 2. Estructura del repositorio
Se cumplio con la planeada desde un inico 

## 3. Antes de empezar

- Las dos VMs del Módulo 2 funcionando: servidor1 (bind9, ufw, Squid) y servidor2 (Apache, ufw).
- Reemplace los valores del ejemplo si su ambiente es distinto: dominio `medired.com`, IP de servidor1 `10.0.0.242`, IP de servidor2 `10.0.0.243`.
- Orden recomendado: MySQL → bases de datos → Node.js y código → ms-usuarios → resto de microservicios → DNS → gateway → frontend → prueba integral.

## 4. servidor1: MySQL

```bash
sudo apt update && sudo apt install -y mysql-server
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
# sin espacio después de la coma
bind-address = 127.0.0.1,10.0.0.242
```

```bash
sudo systemctl restart mysql
sudo ufw allow from 10.0.0.243 to any port 3306 proto tcp
sudo ss -tlnp | grep 3306        # debe aparecer 10.0.0.242:3306
```

### 4.1 Una base de datos y un usuario por microservicio

Se crean en servidor1 con `sudo mysql`. El usuario solo acepta conexiones desde servidor2. Los comandos (sin contraseñas) están en `deploy/crear-bases-y-usuarios.sql`:

```sql
CREATE DATABASE usuarios_db;
CREATE USER 'usuarios_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON usuarios_db.* TO 'usuarios_user'@'10.0.0.243';

CREATE DATABASE pacientes_db;
CREATE USER 'pacientes_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON pacientes_db.* TO 'pacientes_user'@'10.0.0.243';

CREATE DATABASE medicos_db;
CREATE USER 'medicos_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'10.0.0.243';

CREATE DATABASE citas_db;
CREATE USER 'citas_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'10.0.0.243';

CREATE DATABASE historias_db;
CREATE USER 'historias_user'@'10.0.0.243' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'10.0.0.243';
```

Las tablas se crean **desde servidor2** (sección 6), con el `db/schema.sql` de cada microservicio.

## 5. servidor1: registro DNS

En la zona directa de `medired.com` agregue el registro `app`, incremente el serial y reinicie bind9:

```
app    IN    A    10.0.0.243
```

```bash
sudo named-checkzone medired.com <archivo-de-zona>
sudo systemctl restart bind9
```

Prueba desde Windows: `nslookup app.medired.com` debe responder `10.0.0.243`.

## 6. servidor2: Node.js, código y microservicios

### 6.1 Node.js, código y usuario del servicio

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git mysql-client
node -v                                   # 22.9 o superior

sudo adduser --system --group --no-create-home nodeapps
sudo mkdir -p /srv/medired/app && sudo chown vagrant:vagrant /srv/medired/app
git clone https://github.com/Tocijuan07/medired-noche-g51.git /srv/medired/app
```

### 6.2 Tablas en servidor1 (desde servidor2)

Esto también comprueba que el usuario quedó restringido a servidor2. Por cada microservicio:

```bash
cd /srv/medired/app/ms-pacientes
mysql -h 10.0.0.242 -u pacientes_user -p pacientes_db < db/schema.sql
mysql -h 10.0.0.242 -u pacientes_user -p pacientes_db -e "SELECT * FROM pacientes"
```

### 6.3 Dependencias y `.env` de cada microservicio

```bash
cd /srv/medired/app/ms-pacientes
npm ci --omit=dev                         # exige package-lock.json en el repositorio
cp .env.example .env && nano .env
chmod 640 .env && sudo chgrp nodeapps .env
```

| Variable | En el PC (desarrollo) | En servidor2 |
|---|---|---|
| `PORT`, `HOST` | puerto del servicio, `127.0.0.1` | igual |
| `ROLES` | los de la empresa | igual |
| `DB_HOST` | `localhost` | `10.0.0.242` |
| `DB_NAME`, `DB_USER` | `<recurso>_db`, `<recurso>_user` | igual |
| `DB_PASSWORD` | la de desarrollo | la nueva de servidor1 |
| `JWT_SECRET` | la del grupo para desarrollo | una frase nueva, **la misma en todos los microservicios** |
| `PACIENTES_URL`, `MEDICOS_URL` (ms-historias, ms-citas) | `http://127.0.0.1:3002`, `http://127.0.0.1:3003` | igual |

El código no cambia: solo cambia el `.env`.

### 6.4 Servicio systemd

Archivo `/etc/systemd/system/ms-pacientes.service` (copia en `deploy/`):

```ini
[Unit]
Description=Microservicio pacientes - medired
After=network.target

[Service]
User=nodeapps
Group=nodeapps
WorkingDirectory=/srv/medired/app/ms-pacientes
ExecStart=/usr/bin/node --env-file=.env src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ms-pacientes
systemctl status ms-pacientes             # active (running)
curl http://127.0.0.1:3002/health
sudo ss -tlnp | grep 300                  # 127.0.0.1:300X
```

**Despliegue ms-usuarios primero** (3001): sin él nadie obtiene un token. Luego ms-pacientes (3002), ms-medicos (3003), ms-citas (3004) y ms-historias (3005). Cada archivo `.service` cambia solo el nombre, la carpeta y la descripción.

## 7. servidor2: API Gateway con Apache

```bash
sudo a2enmod proxy proxy_http
sudo mkdir -p /var/www/app
sudo nano /etc/apache2/sites-available/app.conf     # copia en deploy/app.conf
```

```apache
<VirtualHost *:80>
    ServerName app.medired.com
    DocumentRoot /var/www/app
    DirectoryIndex login.html index.html

    ProxyPass /api/usuarios http://127.0.0.1:3001/usuarios
    ProxyPassReverse /api/usuarios http://127.0.0.1:3001/usuarios
    ProxyPass /api/pacientes http://127.0.0.1:3002/pacientes
    ProxyPassReverse /api/pacientes http://127.0.0.1:3002/pacientes
    ProxyPass /api/medicos http://127.0.0.1:3003/medicos
    ProxyPassReverse /api/medicos http://127.0.0.1:3003/medicos
    ProxyPass /api/citas http://127.0.0.1:3004/citas
    ProxyPassReverse /api/citas http://127.0.0.1:3004/citas
    ProxyPass /api/historias http://127.0.0.1:3005/historias
    ProxyPassReverse /api/historias http://127.0.0.1:3005/historias

    ErrorLog ${APACHE_LOG_DIR}/app_error.log
    CustomLog ${APACHE_LOG_DIR}/app_access.log combined
</VirtualHost>
```

```bash
sudo a2ensite app.conf
sudo apache2ctl configtest                # Syntax OK
sudo systemctl reload apache2
```

Si el navegador de Windows usa el proxy Squid del Módulo 2, agregue `*.medired.com` a las excepciones del proxy.

## 8. Frontend

El frontend usa rutas relativas (`/api/...`) porque se sirve desde el mismo nombre que la API; por eso no hace falta CORS. Para publicarlo:

```bash
sudo cp -r /srv/medired/app/frontend/* /var/www/app/
```

## 9. Usuarios iniciales

Con el gateway funcionando:

1. Inicie sesión como `admin@empresa.com` con la contraseña entregada por la docente.
2. Cambie la contraseña del administrador: `PUT /api/usuarios/1` con el JSON completo y el campo `password`.
3. Cree un usuario por cada rol (administrador, admisiones, médico) para probar el frontend.

## 10. Prueba de verificación

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | `nslookup app.medired.com` desde Windows | `10.0.0.243` |
| 2 | Abrir `http://app.medired.com` e iniciar sesión con un usuario de cada rol | cada uno llega a la página de su rol |
| 3 | `GET /api/<recurso>` sin token | 401 |
| 4 | `POST /api/<recurso>` con el token de un rol sin permiso | 403 |
| 5 | Colecciones de Postman con base `http://app.medired.com/api` | códigos esperados |
| 6 | `curl.exe http://10.0.0.243:300X/health` y `Test-NetConnection 10.0.0.242 -Port 3306` desde Windows | ambos fallan |
| 7 | Listar en el frontend una entidad con relaciones, con `journalctl -f` abierto | una sola petición `?ids=` |
| 8 | `sudo systemctl stop` del servicio consultado y repetir | aviso en pantalla; al crear, 503 |
| 9 | `sudo reboot` en servidor2 | todo vuelve solo (servicios `enabled`) |

## 11. Actualizar un microservicio

```bash
cd /srv/medired/app && git pull
cd ms-pacientes && npm ci --omit=dev
sudo systemctl restart ms-pacientes
```

Si cambió el frontend, vuelva a copiarlo a `/var/www/app/`.

## 12. Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| `Access denied` de MySQL | usuario `@10.0.0.243`, contraseña del `.env` (solo letras y números) y `DB_HOST` |
| `EADDRINUSE` | otro proceso usa el puerto: `sudo ss -tlnp \| grep 300` |
| El servicio no arranca | `systemctl status ms-<recurso>` y `journalctl -u ms-<recurso> -n 20` |
| 401 con token válido | `JWT_SECRET` distinta entre ms-usuarios y el microservicio |
| 503 en el gateway | el microservicio destino está detenido o no escucha en su puerto |
| 404 en una ruta de `/api` | falta su pareja `ProxyPass` en `app.conf` o no se recargó Apache |
