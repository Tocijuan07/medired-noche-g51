// =====================================================================
// PANEL GENERAL (solo administrador): totales de la clínica y usuarios
// Totales: GET /api/pacientes, /api/medicos, /api/citas y /api/historias (se cuentan los registros)
// Usuarios: GET /api/usuarios, POST /api/usuarios, PUT /api/usuarios/:id, DELETE /api/usuarios/:id
// =====================================================================
const yo = exigirSesion('administrador');
let usuarios = [];

const TOTALES = [
  { ruta: '/pacientes', etiqueta: 'Pacientes', pagina: 'pacientes.html' },
  { ruta: '/medicos', etiqueta: 'Médicos', pagina: 'medicos.html' },
  { ruta: '/citas', etiqueta: 'Citas', pagina: 'citas.html' },
  { ruta: '/historias', etiqueta: 'Historias clínicas', pagina: 'historias.html' },
];

// Una petición por recurso, todas a la vez. Si un microservicio falla, solo su tarjeta lo dice.
async function cargarTotales() {
  const resultados = await Promise.allSettled(TOTALES.map((t) => api(t.ruta)));
  document.getElementById('totales').innerHTML = TOTALES.map((t, i) => {
    const r = resultados[i];
    const numero = r.status === 'fulfilled' && Array.isArray(r.value)
      ? `<strong>${r.value.length}</strong>`
      : '<strong>No disponible</strong>';
    const clase = r.status === 'fulfilled' ? '' : ' sin-dato';
    return `<a class="total${clase}" href="${t.pagina}">${numero}<span>${esc(t.etiqueta)}</span></a>`;
  }).join('');

  const fallidos = TOTALES.filter((t, i) => resultados[i].status === 'rejected');
  if (fallidos.length) {
    const razon = resultados[TOTALES.indexOf(fallidos[0])].reason;
    mostrarMensaje(`No se pudo consultar: ${fallidos.map((t) => t.etiqueta).join(', ')}. ${razon.message}`, 'error');
  }
}

const camposUsuario = (creando) => [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'email', etiqueta: 'Email', tipo: 'email' },
  { nombre: 'rol', etiqueta: 'Rol', tipo: 'select',
    opciones: ROLES.map((rol) => ({ valor: rol, texto: rol })) },
  { nombre: 'activo', etiqueta: 'Estado', tipo: 'select',
    opciones: [{ valor: 'true', texto: 'Activo' }, { valor: 'false', texto: 'Inactivo' }] },
  { nombre: 'password', etiqueta: creando ? 'Contraseña' : 'Nueva contraseña (opcional)',
    tipo: 'password', opcional: !creando, ayuda: 'Mínimo 8 caracteres' },
];

// El formulario entrega texto; la API espera activo como booleano
const aCuerpo = (datos) => ({ ...datos, activo: datos.activo === 'true' });

function pintar() {
  const activos = usuarios.filter((u) => u.activo).length;
  document.getElementById('resumen').textContent = `${usuarios.length} usuarios, ${activos} activos`;
  document.getElementById('lista').innerHTML = usuarios.map((u) => `
    <tr>
      <td>${esc(u.nombre)}${u.id === yo.id ? ' <span class="sub">(usted)</span>' : ''}</td>
      <td>${esc(u.email)}</td>
      <td><span class="etiqueta-rol">${esc(u.rol)}</span></td>
      <td>${u.activo ? 'Activo' : '<span class="sub">Inactivo</span>'}</td>
      <td class="acciones">
        <button class="boton boton-suave boton-chico" data-editar="${u.id}">Editar</button>
        ${u.id === yo.id ? '' : `<button class="boton boton-peligro boton-chico" data-eliminar="${u.id}">Eliminar</button>`}
      </td>
    </tr>`).join('');
}

async function cargar() {
  try {
    usuarios = await api('/usuarios');
    pintar();
  } catch (error) {
    document.getElementById('resumen').textContent = 'No se pudo cargar la lista de usuarios.';
    mostrarError(error);
  }
}

async function crear() {
  const datos = await pedirDatos('Crear usuario', camposUsuario(true),
    { rol: ROLES[1], activo: 'true' }, 'Crear usuario');
  if (!datos) return;
  try {
    await api('/usuarios', { method: 'POST', body: aCuerpo(datos) });
    mostrarMensaje(`Usuario creado: ${datos.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }
}

async function editar(u) {
  const datos = await pedirDatos('Editar usuario', camposUsuario(false),
    { ...u, activo: String(u.activo) });
  if (!datos) return;
  try {
    await api(`/usuarios/${u.id}`, { method: 'PUT', body: aCuerpo(datos) });
    mostrarMensaje('Cambios guardados');
    cargar();
  } catch (error) { mostrarError(error); }
}

async function eliminar(u) {
  if (!(await confirmar(`¿Eliminar a ${u.nombre}?`, 'Eliminar usuario'))) return;
  try {
    await api(`/usuarios/${u.id}`, { method: 'DELETE' });
    mostrarMensaje(`Usuario eliminado: ${u.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }
}

if (yo) {
  pintarEncabezado(yo);
  document.getElementById('nuevo').onclick = crear;
  document.getElementById('lista').onclick = (evento) => {
    const { editar: idEditar, eliminar: idEliminar } = evento.target.dataset;
    const u = usuarios.find((x) => x.id === Number(idEditar || idEliminar));
    if (u && idEditar) editar(u);
    if (u && idEliminar) eliminar(u);
  };
  cargarTotales();
  cargar();
}
