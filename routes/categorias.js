const express = require('express');
const categoriaController = require('../controllers/categoriaController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Públicas (admin y empleado)
router.get('/', categoriaController.obtenerCategorias);
router.get('/:id', categoriaController.obtenerCategoria);

// Solo admin
router.post('/', isAdmin, categoriaController.crearCategoria);
router.put('/:id', isAdmin, categoriaController.actualizarCategoria);
router.delete('/:id', isAdmin, categoriaController.eliminarCategoria);

module.exports = router;