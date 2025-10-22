const express = require('express');
const stockController = require('../controllers/stockController');
const { verifyToken, isAdmin, isEmpleadoOrAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Públicas (admin y empleado)
router.get('/bajo', stockController.obtenerStockBajo);
router.get('/producto/:productoId', stockController.obtenerStockProducto);

// Solo admin
router.post('/', isAdmin, stockController.crearStock);
router.put('/producto/:productoId', isAdmin, stockController.actualizarStock);
router.patch('/ajustar/:productoId', isAdmin, stockController.ajustarStock);

module.exports = router;