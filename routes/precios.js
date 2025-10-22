const express = require('express');
const precioController = require('../controllers/precioController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Públicas (admin y empleado)
router.get('/producto/:productoId', precioController.obtenerPrecioProducto);
router.get('/historial/:productoId', precioController.obtenerHistorialPrecios);

// Solo admin
router.post('/', isAdmin, precioController.crearPrecio);
router.put('/producto/:productoId', isAdmin, precioController.actualizarPrecio);

module.exports = router;