// =====================================================================
// PANTALLA DE HISTORIAS CLÍNICAS (ms-historias)
// Usa: GET /api/historias (opcional ?paciente_id=), POST, PUT /:id, DELETE /:id
// Cada historia llega YA compuesta por el backend con su paciente y su médico
// (UNA petición). Si ms-pacientes o ms-medicos no respondieron: objeto en null + "aviso".
// La ven y escriben: administrador y medico.
// Se llega con ?paciente_id=3 desde «Citas del día» para abrir las historias de ese paciente.
// =====================================================================
const yo = exigirSesion('administrador', 'medico');
const escribe = puedeEscribir('historias');
const pacienteFiltro = Number(new URLSearchParams(location.search).get('paciente_id')) || null;
let historias = [];

const camposHistoria = (pacientes, medicos) => [
  campoReferencia('paciente_id', 'Paciente', pacientes),
  campoReferencia('medico_id', 'Médico', medicos),
  { nombre: 'fecha', etiqueta: 'Fecha de la atención', tipo: 'date', max: hoy() },   // la fecha no puede ser futura
  { nombre: 'motivo_consulta', etiqueta: 'Motivo de la consulta' },
  { nombre: 'diagnostico', etiqueta: 'Diagnóstico' },
  { nombre: 'tratamiento', etiqueta: 'Tratamiento', tipo: 'textarea' },
];

async function cargarReferencias() {
  const [pacientes, medicos] = await Promise.all([
    opcionesDe('/pacientes', (p) => `${p.nombre} (${p.documento})`),
    opcionesDe('/medicos', (m) => `${m.nombre} — ${m.especialidad}`),
  ]);
  const faltan = [!pacientes && 'pacientes', !medicos && 'médicos'].filter(Boolean);
  const nota = faltan.length ? `No se pudo cargar la lista de ${faltan.join(' ni de ')}: escriba el id.` : '';
  return { pacientes, medicos, nota };
}

const celdaRelacionada = (objeto, contenido) =>
  objeto ? contenido(objeto) : '<span class="no-disponible">No disponible</span>';

function pintarCinta() {
  const cinta = document.getElementById('cinta');
  if (!pacienteFiltro) { cinta.innerHTML = ''; return; }
  const conNombre = historias.find((h) => h.paciente);
  const quien = conNombre ? conNombre.paciente.nombre : `paciente #${pacienteFiltro}`;
  cinta.innerHTML = `<div class="cinta"><span>Historias de <strong>${esc(quien)}</strong></span>
    <a class="boton boton-suave boton-chico" href="historias.html">Ver todas</a></div>`;
}

function pintar() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();
  const visibles = historias.filter((h) => [
    h.paciente && h.paciente.nombre, h.medico && h.medico.nombre, h.motivo_consulta, h.diagnostico, h.tratamiento,
  ].join(' ').toLowerCase().includes(texto));

  document.getElementById('resumen').textContent = texto
    ? `${visibles.length} de ${historias.length} historias`
    : `${historias.length} historias`;

  document.getElementById('lista').innerHTML = visibles.length === 0
    ? '<tr><td colspan="7" class="vacio">No hay historias para mostrar.</td></tr>'
    : visibles.map((h) => `
    <tr>
      <td class="fecha">${esc(formatearFecha(h.fecha))}</td>
      <td>${celdaRelacionada(h.paciente, (p) => esc(p.nombre))}</td>
      <td>${celdaRelacionada(h.medico, (m) => `${esc(m.nombre)}<span class="sub">${esc(m.especialidad)}</span>`)}</td>
      <td class="larga">${esc(h.motivo_consulta)}</td>
      <td class="larga">${esc(h.diagnostico)}</td>
      <td class="larga">${esc(h.tratamiento)}</td>
      <td class="acciones">${escribe ? `
        <button class="boton boton-suave boton-chico" data-editar="${h.id}">Editar</button>
        <button class="boton boton-peligro boton-chico" data-eliminar="${h.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

async function cargar() {
  try {
    historias = await api(pacienteFiltro ? `/historias?paciente_id=${pacienteFiltro}` : '/historias');
    mostrarAvisos(historias);
    pintarCinta();
    pintar();
  } catch (error) {
    document.getElementById('resumen').textContent = 'No se pudo cargar la lista de historias.';
    mostrarError(error);
  }
}

async function crear() {
  const { pacientes, medicos, nota } = await cargarReferencias();
  const datos = await pedirDatos('Crear historia clínica', camposHistoria(pacientes, medicos),
    { paciente_id: pacienteFiltro || '', fecha: hoy() }, 'Crear historia', nota);
  if (!datos) return;
  try {
    await api('/historias', { method: 'POST', body: datos });
    mostrarMensaje('Historia creada');
    cargar();
  } catch (error) { mostrarError(error); }   // 400 (paciente/médico no existe, fecha futura) · 403 · 409 repetida · 503
}

async function editar(h) {
  const { pacientes, medicos, nota } = await cargarReferencias();
  const datos = await pedirDatos('Editar historia clínica', camposHistoria(pacientes, medicos), h, 'Guardar', nota);
  if (!datos) return;
  try {
    await api(`/historias/${h.id}`, { method: 'PUT', body: datos });
    mostrarMensaje('Cambios guardados');
    cargar();
  } catch (error) { mostrarError(error); }
}

async function eliminar(h) {
  if (!(await confirmar(`¿Eliminar la historia del ${formatearFecha(h.fecha)}?`, 'Eliminar historia'))) return;
  try {
    await api(`/historias/${h.id}`, { method: 'DELETE' });
    mostrarMensaje('Historia eliminada');
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
    const h = historias.find((x) => x.id === Number(idEditar || idEliminar));
    if (h && idEditar) editar(h);
    if (h && idEliminar) eliminar(h);
  };
  cargar();
}
