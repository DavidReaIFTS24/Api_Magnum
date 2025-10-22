const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Solo admin puede gestionar usuarios
router.get('/', isAdmin, usuarioController.obtenerUsuarios);
router.get('/:id', isAdmin, usuarioController.obtenerUsuario);
router.post('/', isAdmin, usuarioController.crearUsuario);
router.put('/:id', isAdmin, usuarioController.actualizarUsuario);
router.delete('/:id', isAdmin, usuarioController.eliminarUsuario);

// Cambiar password (el usuario puede cambiar su propio password, admin puede cambiar cualquier password)
router.patch('/:id/password', usuarioController.cambiarPassword);

module.exports = router;