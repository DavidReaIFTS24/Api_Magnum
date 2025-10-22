const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado:', err.message);
  
  // Errores de Firebase
  if (err.code === 'permission-denied') {
    return res.status(403).json({
      error: 'Permiso denegado para acceder al recurso.'
    });
  }
  
  if (err.code === 'not-found') {
    return res.status(404).json({
      error: 'Recurso no encontrado.'
    });
  }
  
  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos de entrada inválidos.',
      detalles: err.message
    });
  }
  
  // Error por duplicado
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'El recurso ya existe.'
    });
  }
  
  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido.'
    });
  }
  
  // Error por defecto
  console.error('Error completo:', err);
  res.status(500).json({
    error: 'Error interno del servidor.',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
  });
};

module.exports = errorHandler;