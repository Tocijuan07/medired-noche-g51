// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');
const HttpError = require('../utils/http-error');

const router = Router();

// El administrador ve a cualquiera; los demás, solo su propio registro
function propioOAdministrador(req, res, next) {
  if (req.historia.rol === 'administrador' || req.historia.id === Number(req.params.id)) {
    return next();
  }
  throw new HttpError(403, 'Solo puede consultar su propia información');
}

// Pública: es la puerta de entrada, todavía no hay token
router.post('/login', controller.login);

// Desde aquí, todo exige un token válido
router.use(verificarToken);

router.get('/me', controller.miPerfil);                       // cualquier rol: sus datos
router.get('/:id', propioOAdministrador, controller.obtener);  // propio o administrador

// Lo que sigue, solo el administrador
router.use(requiereRol('administrador'));

router.get('/', controller.listar);      // listar todos los usuarios
router.get('/:id', controller.obtener);  // obtener un usuario por id
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);      // crear un usuario
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar); // Taller 2: actualizar un usuario por id
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar); // Taller 2: eliminar un usuario por id

module.exports = router;