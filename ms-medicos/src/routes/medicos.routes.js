// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/medicos.controller');

const router = Router();

router.get('/', controller.listar);      // listar todos los medicos
router.get('/:id', controller.obtener);  // obtener un medico por id
router.post('/', controller.crear);      // crear un medico
module.exports = router;
