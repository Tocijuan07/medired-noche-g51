# deploy/ · Archivos de despliegue de MediRed IPS (Taller 3)

Copias de los archivos de configuración que se usan en **servidor1** (10.0.0.242) y **servidor2** (10.0.0.243). Ninguno contiene contraseñas: las claves reales solo existen en los `.env` de servidor2 y en MySQL.

## Qué hay y dónde va

| Archivo | Servidor | Destino real | Qué hace |
|---|---|---|---|
| `mysqld.cnf` | servidor1 | `/etc/mysql/mysql.conf.d/mysqld.cnf` (solo la línea `bind-address`) | MySQL escucha en 127.0.0.1 y 10.0.0.242 |
| `crear-bases-y-usuarios.sql` | servidor1 | se ejecuta con `sudo mysql` | Una base y un usuario `@10.0.0.243` por microservicio |
| `db.medired.com` | servidor1 | `/etc/bind/db.medired.com` | Zona DNS con `app.medired.com → 10.0.0.243` |
| `reglas-ufw.sh` | servidor1 y servidor2 | comandos `ufw` | 3306 solo desde servidor2; en servidor2 solo 22 y 80 |
| `ms-usuarios.service` | servidor2 | `/etc/systemd/system/` | ms-usuarios en 127.0.0.1:3001 |
| `ms-pacientes.service` | servidor2 | `/etc/systemd/system/` | ms-pacientes en 127.0.0.1:3002 |
| `ms-medicos.service` | servidor2 | `/etc/systemd/system/` | ms-medicos en 127.0.0.1:3003 |
| `ms-citas.service` | servidor2 | `/etc/systemd/system/` | ms-citas en 127.0.0.1:3004 |
| `ms-historias.service` | servidor2 | `/etc/systemd/system/` | ms-historias en 127.0.0.1:3005 |
| `app.conf` | servidor2 | `/etc/apache2/sites-available/app.conf` | Host virtual: frontend + gateway `/api/<recurso>` |
| `actualizar.sh` | servidor2 | se ejecuta desde el repositorio | `git pull`, dependencias, servicios, frontend y prueba de `/health` |

## Orden de despliegue

1. **servidor1:** `mysqld.cnf` → `crear-bases-y-usuarios.sql` (con claves reales) → `reglas-ufw.sh` → `db.medired.com`.
2. **servidor2:** clonar el repositorio en `/srv/medired/app`, crear el `.env` de cada microservicio (`DB_HOST=10.0.0.242` y la misma `JWT_SECRET` en todos) y cargar cada `db/schema.sql`:
   ```bash
   mysql -h 10.0.0.242 -u citas_user -p citas_db < /srv/medired/app/ms-citas/db/schema.sql
   ```
3. **servidor2:** servicios systemd (primero ms-usuarios), luego `app.conf` y el frontend.

Todos los `.service` corren con el usuario de sistema `nodeapps`:

```bash
sudo adduser --system --group --no-create-home nodeapps
```

## Actualizar después de un cambio en el repositorio

```bash
sudo bash /srv/medired/app/deploy/actualizar.sh
```

Al final imprime la respuesta de `/health` de los puertos 3001 a 3005.

## Verificación rápida

```bash
# servidor2
systemctl status ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias --no-pager
sudo ss -tlnp | grep 300          # todos en 127.0.0.1
sudo apache2ctl configtest        # Syntax OK
tail -f /var/log/apache2/app_access.log

# servidor1
sudo mysql -e "SHOW DATABASES; SELECT user, host FROM mysql.user WHERE user LIKE '%\_user';"
```
