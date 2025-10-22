// Importación de módulos necesarios
const jwt = require('jsonwebtoken'); // Para crear y verificar JSON Web Tokens (JWT)
const bcrypt = require('bcryptjs'); // Para encriptar y comparar contraseñas (hashing)
const Usuario = require('../models/usuarioModel'); // Importa el modelo de usuario para interactuar con la base de datos

// Objeto controlador que contendrá las funciones de autenticación
const authController = {};

/**
 * Función controladora para el inicio de sesión (login).
 * @param {object} req - Objeto de solicitud de Express (contiene el body con email y password).
 * @param {object} res - Objeto de respuesta de Express.
 */
authController.login = async (req, res) => {
    try {
        // Extraer email y password del cuerpo de la solicitud (req.body)
        const { email, password } = req.body;

        console.log(`🔐 Intento de login: ${email}`); // Log para seguimiento del intento de login

        // 1. Validación básica de entrada
        if (!email || !password) {
            // Si falta email o password, devuelve un error 400 (Bad Request)
            return res.status(400).json({
                error: 'Email y password son requeridos.'
            });
        }

        // 2. Buscar el usuario por email en la base de datos
        // Se asume que Usuario.findByEmail es un método del modelo Usuario
        const usuario = await Usuario.findByEmail(email);

        // 3. Verificar si el usuario existe
        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            // Si no se encuentra, devuelve un error 401 (Unauthorized - Credenciales inválidas)
            return res.status(401).json({
                error: 'Credenciales inválidas.' // Mensaje genérico por seguridad
            });
        }

        // 4. Verificar si la cuenta de usuario está activa
        if (!usuario.activo) {
            console.log('❌ Usuario inactivo');
            // Si el usuario está inactivo, devuelve un error 401
            return res.status(401).json({
                error: 'Usuario inactivo.'
            });
        }

        // 5. Comparar la contraseña proporcionada con la contraseña hasheada en la BD
        // ✅ CORRECTO - usando bcryptjs para comparar de forma segura
        const isValidPassword = await bcrypt.compare(password, usuario.password);

        // 6. Verificar si la contraseña es válida
        if (!isValidPassword) {
            console.log('❌ Password incorrecto');
            // Si la contraseña no coincide, devuelve un error 401
            return res.status(401).json({
                error: 'Credenciales inválidas.' // Mensaje genérico por seguridad
            });
        }

        // 7. Generar el JSON Web Token (JWT)
        const token = jwt.sign(
            {
                id: usuario.id, // Payload: ID del usuario
                email: usuario.email, // Payload: Email del usuario
                rol: usuario.rol, // Payload: Rol del usuario
                nombre: usuario.nombre // Payload: Nombre del usuario
            },
            process.env.JWT_SECRET, // Clave secreta para firmar el token (debe estar en variables de entorno)
            { expiresIn: '8h' } // Configuración de expiración del token (8 horas)
        );

        console.log(`✅ Login exitoso: ${email} (${usuario.rol})`); // Log de éxito

        // 8. Enviar respuesta de éxito con el token y datos del usuario
        res.json({
            message: 'Login exitoso',
            token, // Se envía el token generado
            usuario: { // Datos del usuario (sin la contraseña)
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol
            }
        });

    } catch (error) {
        // Manejo de errores generales del servidor o base de datos
        console.error('❌ Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor durante el login.'
        });
    }
};

/**
 * Función controladora para el registro de nuevos usuarios.
 * @param {object} req - Objeto de solicitud de Express (contiene el body con datos del nuevo usuario).
 * @param {object} res - Objeto de respuesta de Express.
 */
authController.register = async (req, res) => {
    try {
        // Extraer datos necesarios para el registro del cuerpo de la solicitud
        const { email, password, nombre, apellido, rol } = req.body;

        console.log(`📝 Intento de registro: ${email}`); // Log para seguimiento del intento de registro

        // 1. Verificar si el usuario ya existe por email
        const usuarioExistente = await Usuario.findByEmail(email);
        if (usuarioExistente) {
            // Si el email ya está registrado, devuelve un error 409 (Conflict)
            return res.status(409).json({
                error: 'El email ya está registrado.'
            });
        }

        // 2. Crear una nueva instancia del modelo Usuario
        // Nota: Se asume que el constructor de Usuario o el método 'save' se encargan de hashear
        // la contraseña ANTES de guardarla en la BD (esto es una buena práctica).
        const usuario = new Usuario({
            email,
            password, // La contraseña se hashea internamente en el modelo
            nombre,
            apellido,
            rol: rol || 'empleado' // Asigna 'empleado' como rol por defecto si no se especifica
        });

        // 3. Guardar el nuevo usuario en la base de datos
        const usuarioCreado = await usuario.save();

        // 4. Eliminar el campo 'password' de la respuesta por seguridad
        // Aunque el campo es el hash, es mejor no enviarlo en la respuesta
        delete usuarioCreado.password;

        console.log(`✅ Usuario registrado: ${email}`); // Log de éxito

        // 5. Enviar respuesta de éxito 201 (Created)
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuario: usuarioCreado // Devuelve el objeto del nuevo usuario (sin password)
        });

    } catch (error) {
        // Manejo de errores generales del servidor o base de datos durante el registro
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor durante el registro.'
        });
    }
};

// Exportar el objeto controlador para que pueda ser utilizado por las rutas
module.exports = authController;