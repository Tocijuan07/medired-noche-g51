// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/pacientes.controller');

const router = Router();

router.get('/', controller.listar);      // listar todos los pacientes
router.get('/:id', controller.obtener);  // obtener un paciente por id
router.post('/', controller.crear);      // crear un paciente
router.put('/:id', controller.actualizar); // actualizar un paciente
router.delete('/:id', controller.eliminar); // eliminar un paciente

module.exports = router;
