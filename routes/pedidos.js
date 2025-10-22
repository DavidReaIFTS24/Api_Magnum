const express = require('express');
const pedidoController = require('../controllers/pedidoController');
const { verifyToken, isEmpleadoOrAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);
router.use(isEmpleadoOrAdmin);

router.post('/', pedidoController.crearPedido);
router.get('/', pedidoController.obtenerPedidos);
router.get('/:id', pedidoController.obtenerPedido);
router.patch('/:id/estado', pedidoController.actualizarEstado);

module.exports = router;