// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador
// y decide quién puede usar cada ruta (tabla de permisos del Taller 1).
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                      // todas las rutas exigen token (sin token: 401)

router.get('/', controller.listar);              // cualquier rol autenticado (?paciente_id= y ?fecha=)
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'medico'), controller.crear);
router.put('/:id', requiereRol('administrador', 'medico'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'medico'), controller.eliminar);

module.exports = router;