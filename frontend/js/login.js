// =====================================================================
// INICIO DE SESIÓN
// Envía email y contraseña a ms-usuarios (POST /api/usuarios/login), guarda
// el token y lleva al usuario a la página de su rol (PAGINA_POR_ROL).
// =====================================================================
const form = document.getElementById('form-login');
const error = document.getElementById('error-login');

// Si ya hay sesión, ir directo a la página del rol
const yaEntro = usuarioActual();
if (yaEntro) location.href = PAGINA_POR_ROL[yaEntro.rol] || 'perfil.html';

form.onsubmit = async (evento) => {
  evento.preventDefault();
  error.textContent = '';
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || !password) {
    error.textContent = 'Escriba el email y la contraseña.';
    return;
  }
  try {
    await iniciarSesion(email, password);
  } catch (e) {
    // 401: datos incorrectos. Otros códigos (0, 503…): el mensaje explica qué pasó
    error.textContent = e.status === 401 ? 'Email o contraseña incorrectos.' : e.message;
  }
};
