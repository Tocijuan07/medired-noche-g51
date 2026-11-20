// =====================================================================
// PANTALLA DE CITAS (ms-citas)
// Usa: GET /api/citas, POST /api/citas, PUT /api/citas/:id, DELETE /api/citas/:id
// Cada cita llega YA compuesta por el backend, con UNA sola petición:
//   { id, fecha_hora, sede, estado, paciente_id, paciente: {id, nombre},
//     medico_id, medico: {id, nombre, especialidad} }
// El frontend NO une datos por su cuenta. Si ms-pacientes o ms-medicos no respondieron,
// el objeto llega en null con un "aviso" y la pantalla lo muestra sin romperse.
// Cada rol la ve a su manera:
//   admisiones → «Agenda de citas» (crea, edita y cancela)
//   medico     → «Citas del día» (solo lee y abre las historias del paciente)
//   administrador → «Citas» (crea, edita, cancela y elimina)
// =====================================================================
const yo = exigirSesion();
const escribe = puedeEscribir('citas');
const esMedico = Boolean(yo) && yo.rol === 'medico';
const veHistorias = Boolean(yo) && PERMISOS_ESCRITURA.historias.includes(yo.rol);
const TITULO_POR_ROL = { medico: 'Citas del día', admisiones: 'Agenda de citas', administrador: 'Citas' };

let citas = [];
let estadoFiltro = 'todas';
let fechaFiltro = esMedico ? hoy() : '';          // el médico abre la pantalla en el día de hoy

const camposCita = (pacientes, medicos) => [
  campoReferencia('paciente_id', 'Paciente', pacientes),
  campoReferencia('medico_id', 'Médico', medicos),
  { nombre: 'fecha_hora', etiqueta: 'Fecha y hora', tipo: 'datetime-local' },
  { nombre: 'sede', etiqueta: 'Sede', tipo: 'select', opciones: SEDES.map((s) => ({ valor: s, texto: s })) },
  { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ESTADOS_CITA.map((e) => ({ valor: e, texto: e })) },
];

// Listas para los desplegables del formulario (null si el microservicio no responde)
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

function pintar() {
  const visibles = citas
    .filter((c) => estadoFiltro === 'todas' || c.estado === estadoFiltro)
    .filter((c) => !fechaFiltro || normalizarFechaHora(c.fecha_hora).slice(0, 10) === fechaFiltro)
    .sort((a, b) => normalizarFechaHora(a.fecha_hora).localeCompare(normalizarFechaHora(b.fecha_hora)));

  document.getElementById('resumen').textContent =
    `${visibles.length} ${visibles.length === 1 ? 'cita' : 'citas'}` +
    (fechaFiltro ? ` el ${formatearFecha(fechaFiltro)}` : '');

  document.getElementById('lista').innerHTML = visibles.length === 0
    ? `<tr><td colspan="6" class="vacio">No hay citas para mostrar${fechaFiltro ? ' en esta fecha. Pruebe con «Todas las fechas»' : ''}.</td></tr>`
    : visibles.map((c) => `
    <tr>
      <td class="fecha">${esc(formatearFechaHora(c.fecha_hora))}</td>
      <td>${celdaRelacionada(c.paciente, (p) => esc(p.nombre))}</td>
      <td>${celdaRelacionada(c.medico, (m) => `${esc(m.nombre)}<span class="sub">${esc(m.especialidad)}</span>`)}</td>
      <td>${esc(c.sede)}</td>
      <td><span class="sello sello-${esc(c.estado)}">${esc(c.estado)}</span></td>
      <td class="acciones">
        ${veHistorias ? `<a class="boton boton-suave boton-chico" href="historias.html?paciente_id=${c.paciente_id}">Historias</a>` : ''}
        ${escribe ? `<button class="boton boton-suave boton-chico" data-editar="${c.id}">Editar</button>` : ''}
        ${escribe && c.estado === 'programada' ? `<button class="boton boton-peligro boton-chico" data-cancelar="${c.id}" title="Cancelar esta cita">Cancelar</button>` : ''}
        ${yo.rol === 'administrador' ? `<button class="boton boton-peligro boton-chico" data-eliminar="${c.id}">Eliminar</button>` : ''}
      </td>
    </tr>`).join('');
}

function pintarFiltroEstado() {
  const contenedor = document.getElementById('filtro-estado');
  contenedor.innerHTML = ['todas', ...ESTADOS_CITA].map((e) =>
    `<button type="button" data-estado="${e}" aria-pressed="${e === estadoFiltro}">${e === 'todas' ? 'Todas' : e}</button>`).join('');
}

async function cargar() {
  try {
    citas = await api('/citas');
    mostrarAvisos(citas);
    pintar();
  } catch (error) {
    document.getElementById('resumen').textContent = 'No se pudo cargar la agenda.';
    mostrarError(error);
  }
}

async function crear() {
  const { pacientes, medicos, nota } = await cargarReferencias();
  const datos = await pedirDatos('Crear cita', camposCita(pacientes, medicos),
    { sede: SEDES[0], estado: 'programada' }, 'Crear cita', nota);
  if (!datos) return;
  try {
    await api('/citas', { method: 'POST', body: datos });
    mostrarMensaje('Cita creada');
    cargar();
  } catch (error) { mostrarError(error); }    // 400 (paciente o médico no existe) · 403 · 409 (médico ocupado) · 503
}

async function editar(c) {
  const { pacientes, medicos, nota } = await cargarReferencias();
  const datos = await pedirDatos('Editar cita', camposCita(pacientes, medicos),
    { ...c, fecha_hora: normalizarFechaHora(c.fecha_hora) }, 'Guardar', nota);
  if (!datos) return;
  try {
    await api(`/citas/${c.id}`, { method: 'PUT', body: datos });
    mostrarMensaje('Cambios guardados');
    cargar();
  } catch (error) { mostrarError(error); }
}

// Cancelar = pasar el estado a «cancelada» (PUT con el JSON completo, sin id)
async function cancelar(c) {
  const pregunta = `¿Cancelar la cita del ${formatearFechaHora(c.fecha_hora)}?`;
  if (!(await confirmar(pregunta, 'Sí, cancelar cita', 'No, volver'))) return;
  const cuerpo = {
    paciente_id: c.paciente_id,
    medico_id: c.medico_id,
    fecha_hora: normalizarFechaHora(c.fecha_hora),
    sede: c.sede,
    estado: 'cancelada',
  };
  try {
    await api(`/citas/${c.id}`, { method: 'PUT', body: cuerpo });
    mostrarMensaje('Cita cancelada');
    cargar();
  } catch (error) { mostrarError(error); }
}

async function eliminar(c) {
  if (!(await confirmar(`¿Eliminar la cita del ${formatearFechaHora(c.fecha_hora)}?`, 'Eliminar cita'))) return;
  try {
    await api(`/citas/${c.id}`, { method: 'DELETE' });
    mostrarMensaje('Cita eliminada');
    cargar();
  } catch (error) { mostrarError(error); }
}

if (yo) {
  pintarEncabezado(yo);
  const titulo = TITULO_POR_ROL[yo.rol] || 'Citas';
  document.getElementById('titulo').textContent = titulo;
  document.title = `MediRed IPS · ${titulo}`;

  const nuevo = document.getElementById('nuevo');
  nuevo.hidden = !escribe;
  nuevo.onclick = crear;

  const campoFecha = document.getElementById('fecha');
  campoFecha.value = fechaFiltro;
  campoFecha.onchange = () => { fechaFiltro = campoFecha.value; pintar(); };
  document.getElementById('todas-fechas').onclick = () => {
    fechaFiltro = '';
    campoFecha.value = '';
    pintar();
  };

  pintarFiltroEstado();
  document.getElementById('filtro-estado').onclick = (evento) => {
    if (!evento.target.dataset.estado) return;
    estadoFiltro = evento.target.dataset.estado;
    pintarFiltroEstado();
    pintar();
  };

  document.getElementById('lista').onclick = (evento) => {
    const { editar: idEditar, cancelar: idCancelar, eliminar: idEliminar } = evento.target.dataset;
    const c = citas.find((x) => x.id === Number(idEditar || idCancelar || idEliminar));
    if (!c) return;
    if (idEditar) editar(c);
    if (idCancelar) cancelar(c);
    if (idEliminar) eliminar(c);
  };
  cargar();
}
