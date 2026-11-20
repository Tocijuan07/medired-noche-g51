// =====================================================================
// CONFIGURACIÓN DEL FRONTEND · MediRed IPS
// Detrás del API Gateway (Apache), el frontend y la API se sirven desde
// el mismo nombre (http://app.medired.com): las llamadas usan la ruta
// relativa /api/<recurso>, sin nombre de servidor ni puerto, y CORS no hace falta.
// =====================================================================
const API = '/api';

const ROLES = ['administrador', 'admisiones', 'medico'];
const SEDES = ['Bogotá', 'Cali', 'Medellín'];
const ESTADOS_CITA = ['programada', 'atendida', 'cancelada'];

// Página de inicio de cada rol (a dónde lleva el login) — mapa de navegación del Taller 1
const PAGINA_POR_ROL = {
  administrador: 'admin.html',
  admisiones: 'citas.html',
  medico: 'citas.html',
};

// Roles que pueden crear, modificar y eliminar cada entidad (tabla de permisos del Taller 1).
// Sirve solo para MOSTRAR u ocultar botones: la protección real la aplica cada
// microservicio con el token (responde 403 aunque la petición salga de Postman).
const PERMISOS_ESCRITURA = {
  usuarios: ['administrador'],
  pacientes: ['administrador', 'admisiones'],
  medicos: ['administrador'],
  citas: ['administrador', 'admisiones'],
  historias: ['administrador', 'medico'],
};

// Menú de cada rol: [página, texto]
const MENU_POR_ROL = {
  administrador: [
    ['admin.html', 'Panel general'],
    ['pacientes.html', 'Pacientes'],
    ['medicos.html', 'Médicos'],
    ['citas.html', 'Citas'],
    ['historias.html', 'Historias clínicas'],
    ['perfil.html', 'Mi perfil'],
  ],
  admisiones: [
    ['citas.html', 'Agenda de citas'],
    ['pacientes.html', 'Pacientes'],
    ['medicos.html', 'Médicos'],
    ['perfil.html', 'Mi perfil'],
  ],
  medico: [
    ['citas.html', 'Citas del día'],
    ['historias.html', 'Historias clínicas'],
    ['pacientes.html', 'Pacientes'],
    ['perfil.html', 'Mi perfil'],
  ],
};
