; Copia de /etc/bind/db.medired.com (servidor1)
; Zona directa de medired.com. El registro "app" apunta a servidor2 (Apache).
; Cada vez que se cambie el archivo, incrementar el Serial.
;
; Validar y aplicar:  sudo named-checkzone medired.com /etc/bind/db.medired.com
;                     sudo systemctl restart bind9
; Probar desde Windows: nslookup app.medired.com   → 10.0.0.243
$TTL 86400
@ IN SOA server1.medired.com. admin.medired.com. (
    3        ; Serial
    604800   ; Refresh
    86400    ; Retry
    2419200  ; Expire
    86400 )  ; Negative Cache TTL
@        IN NS server1.medired.com.
server1  IN A 10.0.0.242
server2  IN A 10.0.0.243
app      IN A 10.0.0.243
www      IN A 10.0.0.243
intranet IN A 10.0.0.243
