// =====================================================================
// AYUDAS DE INTERFAZ: mensajes, avisos, fechas y formulario en un cuadro de diálogo.
// =====================================================================

// Escapa texto antes de ponerlo en el HTML (evita inyectar etiquetas)
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mostrarMensaje(texto, tipo = 'ok') {
  const aviso = document.createElement('div');
  aviso.className = `mensaje mensaje-${tipo}`;
  aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  aviso.textContent = texto;
  document.getElementById('mensajes').appendChild(aviso);
  setTimeout(() => aviso.remove(), tipo === 'error' ? 7000 : 3000);
}

// Muestra el mensaje del microservicio (400, 403, 404, 409, 503…) con sus detalles
function mostrarError(error) {
  const detalles = Array.isArray(error.detalles) ? error.detalles : [];
  const detalle = detalles.length ? `: ${detalles.join('; ')}` : '';
  mostrarMensaje(`${error.message}${detalle}`, 'error');
}

// Respuestas compuestas (citas, historias): si un microservicio relacionado no respondió,
// el backend devuelve el objeto en null y un campo "aviso". Se muestra UNA vez por aviso distinto.
function mostrarAvisos(lista) {
  const contenedor = document.getElementById('avisos');
  const avisos = [...new Set(lista.map((x) => x.aviso).filter(Boolean))];
  contenedor.innerHTML = avisos.map((a) =>
    `<p class="mensaje mensaje-alerta" role="status">⚠ ${esc(a)}. Se muestran los demás datos disponibles.</p>`).join('');
}

// ---------- Fechas ----------
// MySQL puede entregar '2026-11-03 09:00:00' y el contrato dice '2026-11-03T09:00': se aceptan ambas.
function normalizarFechaHora(valor) {
  return String(valor ?? '').replace(' ', 'T').slice(0, 16);
}

function formatearFecha(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor ?? '');
}

function formatearFechaHora(valor) {
  const [fecha, hora] = normalizarFechaHora(valor).split('T');
  return `${formatearFecha(fecha)} ${hora || ''}`.trim();
}

// Fecha de hoy en hora local, AAAA-MM-DD (toISOString usaría UTC y podría adelantar el día)
function hoy() {
  return new Date().toLocaleDateString('en-CA');
}

// ---------- Formulario en un cuadro de diálogo ----------
// campos: [{ nombre, etiqueta, tipo: 'text'|'email'|'password'|'date'|'datetime-local'|'number'|'textarea'|'select',
//            opciones (select), opcional, numero (convierte a número), max, ayuda }]
// Devuelve una promesa con los datos escritos, o null si se cancela.
function crearControl(c, valor) {
  const requerido = c.opcional ? '' : 'required';
  if (c.tipo === 'select') {
    return `<select name="${c.nombre}" ${requerido}>
      ${c.opciones.map((o) => `<option value="${esc(o.valor)}" ${String(o.valor) === String(valor) ? 'selected' : ''}>${esc(o.texto)}</option>`).join('')}
    </select>`;
  }
  if (c.tipo === 'textarea') {
    return `<textarea name="${c.nombre}" rows="3" ${requerido}>${esc(valor)}</textarea>`;
  }
  return `<input name="${c.nombre}" type="${c.tipo || 'text'}" value="${esc(valor)}" ${requerido}
    ${c.max ? `max="${esc(c.max)}"` : ''} ${c.tipo === 'number' ? 'min="1" step="1"' : ''}
    ${c.ayuda ? `placeholder="${esc(c.ayuda)}"` : ''}>`;
}

function pedirDatos(titulo, campos, valores = {}, textoBoton = 'Guardar', nota = '', textoCancelar = 'Cancelar') {
  const dialogo = document.getElementById('dialogo');
  const filas = campos.map((c) => {
    const valor = valores[c.nombre] ?? '';
    return `<label class="campo"><span>${esc(c.etiqueta)}</span>${crearControl(c, valor)}</label>`;
  }).join('');

  dialogo.innerHTML = `
    <form method="dialog" class="formulario">
      <h2>${esc(titulo)}</h2>
      ${nota ? `<p class="ayuda-form">${esc(nota)}</p>` : ''}
      ${filas}
      <div class="acciones-form">
        <button type="button" class="boton boton-suave" value="cancelar">${esc(textoCancelar)}</button>
        <button type="submit" class="boton">${esc(textoBoton)}</button>
      </div>
    </form>`;

  return new Promise((resolver) => {
    const form = dialogo.querySelector('form');
    form.querySelector('[value="cancelar"]').onclick = () => { dialogo.close(); resolver(null); };
    form.onsubmit = (evento) => {
      evento.preventDefault();
      const datos = {};
      for (const c of campos) {
        const texto = form.elements[c.nombre].value.trim();
        if (c.opcional && texto === '') continue;      // campo opcional vacío: no se envía
        datos[c.nombre] = c.numero ? Number(texto) : texto;
      }
      dialogo.close();
      resolver(datos);
    };
    dialogo.oncancel = () => resolver(null);
    dialogo.showModal();
    (form.querySelector('input, select, textarea') || form.querySelector('[type=submit]')).focus();
  });
}

async function confirmar(texto, textoBoton, textoCancelar = 'Cancelar') {
  return (await pedirDatos(texto, [], {}, textoBoton, '', textoCancelar)) !== null;
}

// Opciones de un <select> de pacientes o médicos para los formularios de citas e historias.
// Si el microservicio no responde, el formulario cae a un campo numérico para escribir el id.
async function opcionesDe(ruta, texto) {
  try {
    const lista = await api(ruta);
    return lista.map((x) => ({ valor: x.id, texto: texto(x) }));
  } catch (error) {
    return null;
  }
}

// Campo de formulario para una referencia (paciente_id, medico_id): lista desplegable o, si no hay lista, número
function campoReferencia(nombre, etiqueta, opciones) {
  if (opciones) {
    return { nombre, etiqueta, tipo: 'select', numero: true,
      opciones: [{ valor: '', texto: 'Seleccione…' }, ...opciones] };
  }
  return { nombre, etiqueta: `${etiqueta} (escriba el id)`, tipo: 'number', numero: true };
}
