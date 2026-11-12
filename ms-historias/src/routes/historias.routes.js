// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');
const HttpError = require('../utils/http-error');

const router = Router();

// Desde aquí, todo exige un token válido
router.use(verificarToken);

router.get('/', controller.listar);      // listar todos los usuarios
router.get('/:id', controller.obtener);  // obtener un usuario por id
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);      // crear un usuario
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar); // Taller 2: actualizar un usuario por id
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar); // Taller 2: eliminar un usuario por id

module.exports = router;