#!/bin/bash
# =====================================================================
# servidor2 · Trae lo último del repositorio y reinicia todo.
# Uso:  sudo bash /srv/medired/app/deploy/actualizar.sh
# Los archivos .env NO se tocan (están en .gitignore).
# =====================================================================
set -e
APP=/srv/medired/app

cd "$APP"
git config --global --add safe.directory "$APP" 2>/dev/null || true
git pull

declare -A CARPETA=(
  [ms-usuarios]=ms-usuarios-completo/ms-usuarios
  [ms-pacientes]=ms-pacientes
  [ms-medicos]=ms-medicos
  [ms-citas]=ms-citas
  [ms-historias]=ms-historias
)

for servicio in ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias; do
  echo "== $servicio"
  (cd "$APP/${CARPETA[$servicio]}" && npm install --omit=dev --no-audit --no-fund)
done

chown -R nodeapps:nodeapps "$APP"
cp "$APP"/deploy/*.service /etc/systemd/system/
systemctl daemon-reload

for servicio in ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias; do
  systemctl reset-failed "$servicio" 2>/dev/null || true
  systemctl enable --now "$servicio"
  systemctl restart "$servicio"
done

# Frontend
cp -r "$APP"/frontend/* /var/www/app/

sleep 2
echo
for puerto in 3001 3002 3003 3004 3005; do
  printf '%s  ' "$puerto"; curl -s --max-time 3 "http://127.0.0.1:$puerto/health" || printf 'NO RESPONDE'; echo
done
systemctl --no-pager --type=service --state=running | grep ms- || true
