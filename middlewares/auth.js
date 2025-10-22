// Importación de módulos necesarios
const jwt = require('jsonwebtoken'); // Para la creación y verificación de JSON Web Tokens
const Usuario = require('../models/usuarioModel'); // (Aunque no se usa directamente aquí, se mantiene por convención)

// Objeto de middleware de autenticación y autorización
const auth = {};

/**
 * Middleware para verificar la validez del token JWT y adjuntar los datos del usuario a la solicitud (req.user).
 * Esta función es la base de la autenticación.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar el control al siguiente middleware o ruta.
 */
auth.verifyToken = (req, res, next) => {
    // 1. Intentar obtener el token del encabezado 'Authorization' (formato: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 2. Verificar la existencia del token
    if (!token) {
        console.log('❌ Acceso denegado. Token no proporcionado.');
        return res.status(401).json({ // 401 Unauthorized
            error: 'Acceso denegado. Token requerido.'
        });
    }

    try {
        // 3. Verificar el token usando la clave secreta del entorno
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Adjuntar los datos decodificados del token (ej: id, email, rol) al objeto de solicitud
        req.user = decoded; 
        
        console.log(`✅ Token verificado para usuario: ${decoded.email}`);
        
        // 5. Continuar al siguiente middleware o manejador de ruta
        next();
        
    } catch (error) {
        // Manejo de errores de verificación (ej: token expirado, firma inválida)
        console.log('❌ Token inválido:', error.message);
        return res.status(401).json({ // 401 Unauthorized
            error: 'Token inválido.'
        });
    }
};

/**
 * Middleware de autorización que restringe el acceso solo a usuarios con rol 'admin'.
 * Debe usarse DESPUÉS de 'verifyToken'.
 * @param {object} req - Objeto de solicitud de Express (contiene req.user).
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar el control al siguiente middleware o ruta.
 */
auth.isAdmin = (req, res, next) => {
    // 1. Comprobar el rol del usuario adjunto en req.user
    if (req.user.rol !== 'admin') {
        console.log(`❌ Acceso denegado. Se requiere rol admin. Usuario: ${req.user.email}`);
        return res.status(403).json({ // 403 Forbidden
            error: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }
    
    // 2. Si el rol es 'admin', permitir el acceso
    console.log(`✅ Acceso admin autorizado: ${req.user.email}`);
    next();
};

/**
 * Middleware de autorización que permite el acceso a usuarios con rol 'empleado' o 'admin'.
 * Útil para la mayoría de las operaciones internas del sistema de inventario.
 * Debe usarse DESPUÉS de 'verifyToken'.
 * @param {object} req - Objeto de solicitud de Express (contiene req.user).
 * @param {object} res - Objeto de respuesta de Express.
 * @param {function} next - Función para pasar el control al siguiente middleware o ruta.
 */
auth.isEmpleadoOrAdmin = (req, res, next) => {
    // 1. Comprobar si el rol es 'admin' O 'empleado'
    if (req.user.rol !== 'admin' && req.user.rol !== 'empleado') {
        console.log(`❌ Acceso denegado. Rol no autorizado: ${req.user.rol}`);
        return res.status(403).json({ // 403 Forbidden
            error: 'Acceso denegado. Rol no autorizado.'
        });
    }
    
    // 2. Si el rol es uno de los autorizados, permitir el acceso
    console.log(`✅ Acceso autorizado para rol: ${req.user.rol}`);
    next();
};

// Exportar el objeto con todos los middlewares
module.exports = auth;