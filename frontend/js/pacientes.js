// =====================================================================
// PANTALLA DE PACIENTES (ms-pacientes) — responsable: Juan Diego Parra
// Usa: GET /api/pacientes, POST /api/pacientes, PUT /api/pacientes/:id, DELETE /api/pacientes/:id
// Ven la lista: administrador, admisiones y medico. Escriben: administrador y admisiones.
// Los botones se ocultan según el rol, pero la protección real es el 403 del microservicio.
// =====================================================================
const yo = exigirSesion();
const escribe = puedeEscribir('pacientes');
let pacientes = [];

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'documento', etiqueta: 'Documento' },
  { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', max: hoy() },
  { nombre: 'eps', etiqueta: 'EPS' },
  { nombre: 'telefono', etiqueta: 'Teléfono' },
];

function pintar() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();
  const visibles = pacientes.filter((p) =>
    [p.nombre, p.documento, p.eps].join(' ').toLowerCase().includes(texto));

  document.getElementById('resumen').textContent = texto
    ? `${visibles.length} de ${pacientes.length} pacientes`
    : `${pacientes.length} pacientes`;

  document.getElementById('lista').innerHTML = visibles.length === 0
    ? '<tr><td colspan="6" class="vacio">No hay pacientes para mostrar.</td></tr>'
    : visibles.map((p) => `
    <tr>
      <td>${esc(p.nombre)}</td>
      <td>${esc(p.documento)}</td>
      <td>${esc(formatearFecha(p.fecha_nacimiento))}</td>
      <td>${esc(p.eps)}</td>
      <td>${esc(p.telefono)}</td>
      <td class="acciones">${escribe ? `
        <button class="boton boton-suave boton-chico" data-editar="${p.id}">Editar</button>
        <button class="boton boton-peligro boton-chico" data-eliminar="${p.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

async function cargar() {
  try {
    pacientes = await api('/pacientes');
    pintar();
  } catch (error) {
    document.getElementById('resumen').textContent = 'No se pudo cargar la lista de pacientes.';
    mostrarError(error);
  }
}

async function crear() {
  const datos = await pedirDatos('Crear paciente', campos, {}, 'Crear paciente');
  if (!datos) return;
  try {
    await api('/pacientes', { method: 'POST', body: datos });
    mostrarMensaje(`Paciente creado: ${datos.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }      // 400 datos inválidos · 403 sin permiso · 409 documento repetido
}

async function editar(p) {
  const datos = await pedirDatos('Editar paciente', campos, p);
  if (!datos) return;
  try {
    await api(`/pacientes/${p.id}`, { method: 'PUT', body: datos });
    mostrarMensaje('Cambios guardados');
    cargar();
  } catch (error) { mostrarError(error); }
}

async function eliminar(p) {
  if (!(await confirmar(`¿Eliminar a ${p.nombre}?`, 'Eliminar paciente'))) return;
  try {
    await api(`/pacientes/${p.id}`, { method: 'DELETE' });
    mostrarMensaje(`Paciente eliminado: ${p.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }
}

if (yo) {
  pintarEncabezado(yo);
  const nuevo = document.getElementById('nuevo');
  nuevo.hidden = !escribe;                       // el botón solo aparece a quien puede crear
  nuevo.onclick = crear;
  document.getElementById('buscar').oninput = pintar;
  document.getElementById('lista').onclick = (evento) => {
    const { editar: idEditar, eliminar: idEliminar } = evento.target.dataset;
    const p = pacientes.find((x) => x.id === Number(idEditar || idEliminar));
    if (p && idEditar) editar(p);
    if (p && idEliminar) eliminar(p);
  };
  cargar();
}
