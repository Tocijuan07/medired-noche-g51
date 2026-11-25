// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador
// y decide quién puede usar cada ruta (tabla de permisos del Taller 1):
//   consultar (GET): cualquier rol autenticado
//   crear, modificar y eliminar: administrador y admisiones
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/citas.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                       // todas las rutas exigen token (sin token: 401)

router.get('/', controller.listar);               // cualquier rol autenticado (con filtros opcionales)
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar);

module.exports = router;
