// =====================================================================
// MI PERFIL (cualquier rol)
// Usa: GET /api/usuarios/me — los datos del dueño del token
// =====================================================================
const yo = exigirSesion();

async function cargarPerfil() {
  try {
    const u = await api('/usuarios/me');
    document.getElementById('perfil').innerHTML = `
      <dt>Nombre</dt><dd>${esc(u.nombre)}</dd>
      <dt>Email</dt><dd>${esc(u.email)}</dd>
      <dt>Rol</dt><dd><span class="etiqueta-rol">${esc(u.rol)}</span></dd>
      <dt>Estado</dt><dd>${u.activo ? 'Activo' : 'Inactivo'}</dd>`;
  } catch (error) { mostrarError(error); }
}

if (yo) {
  pintarEncabezado(yo);
  cargarPerfil();
}
