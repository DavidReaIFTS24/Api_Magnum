/**
 * Middleware centralizado de manejo de errores para Express.
 * Debe ser el último middleware cargado en la aplicación.
 * @param {Error} err - Objeto de error capturado.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar el control (no se usa a menudo aquí).
 */
const errorHandler = (err, req, res, next) => {
    // 1. Logear el error principal para propósitos de debugging interno
    console.error('❌ Error capturado:', err.message);
    
    // -------------------------------------------------------------------------
    // 2. Manejo de Errores Específicos (Personalización de Códigos HTTP)
    // -------------------------------------------------------------------------

    // 2.1. Errores de Firebase/Firestore (Asumiendo que el modelo lanza errores con un campo 'code')
    
    // Error de permiso denegado (por ejemplo, por reglas de seguridad de Firestore)
    if (err.code === 'permission-denied') {
        return res.status(403).json({ // 403 Forbidden
            error: 'Permiso denegado para acceder al recurso.'
        });
    }
    
    // Error de recurso no encontrado (similar a un 404 a nivel de base de datos)
    if (err.code === 'not-found') {
        return res.status(404).json({ // 404 Not Found
            error: 'Recurso no encontrado.'
        });
    }
    
    // 2.2. Errores de Mongoose/Modelos (ej: un campo requerido no está presente)
    
    // Error de validación (usado comúnmente en Mongoose para esquemas fallidos)
    if (err.name === 'ValidationError') {
        return res.status(400).json({ // 400 Bad Request
            error: 'Datos de entrada inválidos.',
            detalles: err.message // Detalle del error de validación (útil en desarrollo)
        });
    }
    
    // 2.3. Errores de Duplicado (usado comúnmente en MongoDB para índices únicos)
    
    // Error por clave duplicada (código 11000 de MongoDB)
    if (err.code === 11000) {
        return res.status(409).json({ // 409 Conflict
            error: 'El recurso ya existe (clave única duplicada).'
        });
    }
    
    // 2.4. Errores de Autenticación
    
    // Error JWT (token inválido, expirado, etc.)
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ // 401 Unauthorized
            error: 'Token de autenticación inválido o expirado.'
        });
    }
    
    // -------------------------------------------------------------------------
    // 3. Manejo de Errores por Defecto (500 Internal Server Error)
    // -------------------------------------------------------------------------

    // Logear el objeto de error completo para facilitar el debugging en el servidor
    console.error('Error completo:', err);
    
    // Respuesta genérica 500
    res.status(500).json({
        error: 'Error interno del servidor.',
        // Mostrar el mensaje de error solo en modo de desarrollo para no exponer detalles de la aplicación
        mensaje: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador para más detalles.'
    });
};

module.exports = errorHandler;