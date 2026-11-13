// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// Permisos: cualquier rol autenticado consulta; solo administrador y
// admisiones crean, modifican y eliminan.
// =====================================================================
const { Router } = require('express');
const { verificarToken, requiereRol } = require('../middlewares/auth');
const controller = require('../controllers/citas.controller');

const router = Router();

router.use(verificarToken); // todas las rutas exigen token (sin token: 401)

router.get('/', controller.listar);        // listar todas las citas (con filtros opcionales)
router.get('/:id', controller.obtener);    // obtener una cita por id
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar);

module.exports = router;
