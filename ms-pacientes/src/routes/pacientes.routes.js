const { Router } = require('express');
const controller = require('../controllers/pacientes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                      // todas las rutas exigen token (sin token: 401)

router.get('/', controller.listar);              // cualquier rol autenticado
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar);

module.exports = router;
