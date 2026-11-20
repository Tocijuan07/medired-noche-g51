// =====================================================================
// PANTALLA DE MÉDICOS (ms-medicos) — responsable: Juan Diego Parra
// Usa: GET /api/medicos, POST /api/medicos, PUT /api/medicos/:id, DELETE /api/medicos/:id
// Ven la lista: administrador y admisiones (solo lectura). Escribe: solo administrador.
// =====================================================================
const yo = exigirSesion('administrador', 'admisiones');
const escribe = puedeEscribir('medicos');
let medicos = [];

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'registro_medico', etiqueta: 'Registro médico', ayuda: 'Ejemplo: RM-10004' },
  { nombre: 'especialidad', etiqueta: 'Especialidad' },
  { nombre: 'sede', etiqueta: 'Sede', tipo: 'select',
    opciones: SEDES.map((s) => ({ valor: s, texto: s })) },
];

function pintar() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();
  const visibles = medicos.filter((m) =>
    [m.nombre, m.registro_medico, m.especialidad, m.sede].join(' ').toLowerCase().includes(texto));

  document.getElementById('resumen').textContent = texto
    ? `${visibles.length} de ${medicos.length} médicos`
    : `${medicos.length} médicos`;

  document.getElementById('lista').innerHTML = visibles.length === 0
    ? '<tr><td colspan="5" class="vacio">No hay médicos para mostrar.</td></tr>'
    : visibles.map((m) => `
    <tr>
      <td>${esc(m.nombre)}</td>
      <td>${esc(m.registro_medico)}</td>
      <td>${esc(m.especialidad)}</td>
      <td>${esc(m.sede)}</td>
      <td class="acciones">${escribe ? `
        <button class="boton boton-suave boton-chico" data-editar="${m.id}">Editar</button>
        <button class="boton boton-peligro boton-chico" data-eliminar="${m.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

async function cargar() {
  try {
    medicos = await api('/medicos');
    pintar();
  } catch (error) {
    document.getElementById('resumen').textContent = 'No se pudo cargar la lista de médicos.';
    mostrarError(error);
  }
}

async function crear() {
  const datos = await pedirDatos('Crear médico', campos, { sede: SEDES[0] }, 'Crear médico');
  if (!datos) return;
  try {
    await api('/medicos', { method: 'POST', body: datos });
    mostrarMensaje(`Médico creado: ${datos.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }      // 400 · 403 · 409 registro médico repetido
}

async function editar(m) {
  const datos = await pedirDatos('Editar médico', campos, m);
  if (!datos) return;
  try {
    await api(`/medicos/${m.id}`, { method: 'PUT', body: datos });
    mostrarMensaje('Cambios guardados');
    cargar();
  } catch (error) { mostrarError(error); }
}

async function eliminar(m) {
  if (!(await confirmar(`¿Eliminar a ${m.nombre}?`, 'Eliminar médico'))) return;
  try {
    await api(`/medicos/${m.id}`, { method: 'DELETE' });
    mostrarMensaje(`Médico eliminado: ${m.nombre}`);
    cargar();
  } catch (error) { mostrarError(error); }
}

if (yo) {
  pintarEncabezado(yo);
  const nuevo = document.getElementById('nuevo');
  nuevo.hidden = !escribe;
  nuevo.onclick = crear;
  document.getElementById('buscar').oninput = pintar;
  document.getElementById('lista').onclick = (evento) => {
    const { editar: idEditar, eliminar: idEliminar } = evento.target.dataset;
    const m = medicos.find((x) => x.id === Number(idEditar || idEliminar));
    if (m && idEditar) editar(m);
    if (m && idEliminar) eliminar(m);
  };
  cargar();
}
