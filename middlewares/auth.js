const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');

const auth = {};

auth.verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ Acceso denegado. Token no proporcionado.');
    return res.status(401).json({
      error: 'Acceso denegado. Token requerido.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`✅ Token verificado para usuario: ${decoded.email}`);
    next();
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
    return res.status(401).json({
      error: 'Token inválido.'
    });
  }
};

auth.isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    console.log(`❌ Acceso denegado. Se requiere rol admin. Usuario: ${req.user.email}`);
    return res.status(403).json({
      error: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
  console.log(`✅ Acceso admin autorizado: ${req.user.email}`);
  next();
};

auth.isEmpleadoOrAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'empleado') {
    console.log(`❌ Acceso denegado. Rol no autorizado: ${req.user.rol}`);
    return res.status(403).json({
      error: 'Acceso denegado. Rol no autorizado.'
    });
  }
  console.log(`✅ Acceso autorizado para rol: ${req.user.rol}`);
  next();
};

module.exports = auth;