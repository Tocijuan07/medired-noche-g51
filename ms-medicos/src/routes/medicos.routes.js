// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================

const { Router } = require('express');
const controller = require('../controllers/medicos.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                      // todas las rutas exigen token (sin token: 401)

router.get('/', controller.listar);              // cualquier rol autenticado
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador'), controller.crear);
router.put('/:id', requiereRol('administrador'), controller.actualizar);
router.delete('/:id', requiereRol('administrador'), controller.eliminar);

module.exports = router;
