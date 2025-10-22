const express = require('express');
const productoController = require('../controllers/productoController');
const { verifyToken, isAdmin, isEmpleadoOrAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);
router.use(isEmpleadoOrAdmin);

// Públicas (admin y empleado)
router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProducto);
router.get('/categoria/:categoriaId', productoController.obtenerProductosPorCategoria);

// Solo admin
router.post('/', isAdmin, productoController.crearProducto);
router.put('/:id', isAdmin, productoController.actualizarProducto);
router.delete('/:id', isAdmin, productoController.eliminarProducto);

module.exports = router;