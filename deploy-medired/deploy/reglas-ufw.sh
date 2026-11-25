#!/bin/bash
# =====================================================================
# Reglas de firewall (ufw) del Módulo 3. Ejecutar CADA BLOQUE en su servidor.
# No se abre ningún puerto 3001-3005: los microservicios solo se alcanzan
# a través de Apache (puerto 80).
# =====================================================================

# ---------- servidor1 (10.0.0.242) ----------
# MySQL solo desde servidor2
sudo ufw allow from 10.0.0.243 to any port 3306 proto tcp
# (DNS 53 y SSH 22 ya estaban abiertos desde el Módulo 2)
sudo ufw status numbered

# ---------- servidor2 (10.0.0.243) ----------
# sudo ufw allow 22/tcp
# sudo ufw allow 80/tcp
# sudo ufw status numbered

# ---------- Comprobación desde Windows (PowerShell) ----------
# Test-NetConnection 10.0.0.242 -Port 3306         → TcpTestSucceeded : False
# curl.exe --max-time 5 http://10.0.0.243:3004/health → timeout
