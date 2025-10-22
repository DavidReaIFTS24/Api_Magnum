// Importación de modelos y bibliotecas necesarias
const Usuario = require('../models/usuarioModel'); // Modelo para interactuar con la colección de usuarios
const bcrypt = require('bcryptjs'); // Biblioteca para el hashing y comparación de contraseñas

// Objeto controlador que agrupa las funciones de manejo de usuarios
const usuarioController = {};

/**
 * Función controladora para obtener una lista de todos los usuarios.
 * Método HTTP: GET /api/usuarios
 * Se asegura de no exponer las contraseñas en la respuesta.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.obtenerUsuarios = async (req, res) => {
    try {
        // 1. Obtener todos los usuarios del modelo
        const usuarios = await Usuario.findAll();
        
        // 2. Limpiar la respuesta (No enviar passwords)
        const usuariosSinPassword = usuarios.map(usuario => {
            // Utiliza la desestructuración para separar la password del resto de los datos
            const { password, ...usuarioSinPassword } = usuario;
            return usuarioSinPassword;
        });
        
        console.log(`✅ Obtenidos ${usuariosSinPassword.length} usuarios`); // Log de éxito
        
        // 3. Enviar la lista de usuarios (sin password)
        res.json({
            usuarios: usuariosSinPassword,
            total: usuariosSinPassword.length
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener usuarios.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener los detalles de un único usuario por ID.
 * Método HTTP: GET /api/usuarios/:id
 * Se asegura de no exponer la contraseña en la respuesta.
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.obtenerUsuario = async (req, res) => {
    try {
        // 1. Obtener el ID del usuario de los parámetros de la URL
        const { id } = req.params;
        
        // 2. Buscar el usuario por ID
        const usuario = await Usuario.findById(id);
        
        // 3. Verificar si el usuario existe
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }
        
        // 4. Limpiar la respuesta (No enviar password)
        const { password, ...usuarioSinPassword } = usuario;
        
        console.log(`✅ Usuario obtenido: ${usuario.email}`); // Log de éxito
        
        // 5. Enviar respuesta exitosa con el usuario (sin password)
        res.json({
            usuario: usuarioSinPassword
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener usuario.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para crear un nuevo usuario.
 * Método HTTP: POST /api/usuarios
 * Nota: El hashing de la contraseña debe realizarse *antes* de que el modelo guarde los datos.
 * @param {object} req - Objeto de solicitud de Express (contiene body).
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.crearUsuario = async (req, res) => {
    try {
        // 1. Desestructurar los datos del cuerpo
        const { email, password, nombre, apellido, rol } = req.body;
        
        console.log(`👤 Creando usuario: ${email}`); // Log de inicio
        
        // 2. Validación de campos requeridos
        if (!email || !password || !nombre) {
            return res.status(400).json({
                error: 'Email, password y nombre son requeridos.'
            });
        }
        
        // 3. Verificar si el usuario ya existe por email (prevenir duplicados)
        const usuarioExistente = await Usuario.findByEmail(email);
        if (usuarioExistente) {
            return res.status(409).json({ // 409 Conflict
                error: 'El email ya está registrado.'
            });
        }
        
        // 4. Crear la instancia del usuario
        const usuario = new Usuario({
            email,
            // La contraseña se hashea dentro del constructor o método .save() del modelo (asumido)
            password, 
            nombre,
            apellido,
            // Asignar 'empleado' por defecto si no se especifica rol
            rol: rol || 'empleado' 
        });
        
        // 5. Guardar el usuario (el modelo hashea la password antes de guardar)
        const usuarioCreado = await usuario.save();
        
        // 6. Limpiar la respuesta (excluir password)
        const { password: _, ...usuarioRespuesta } = usuarioCreado;
        
        console.log(`✅ Usuario creado exitosamente: ${email}`); // Log de éxito
        
        // 7. Enviar respuesta de éxito 201 (Created)
        res.status(201).json({
            message: 'Usuario creado exitosamente',
            usuario: usuarioRespuesta
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error creando usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear usuario.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar los datos principales de un usuario.
 * Método HTTP: PUT /api/usuarios/:id
 * Incluye restricción de seguridad para administradores.
 * @param {object} req - Objeto de solicitud de Express (contiene params, body y req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.actualizarUsuario = async (req, res) => {
    try {
        // 1. Obtener ID del usuario a actualizar y los datos del cuerpo
        const { id } = req.params;
        const { nombre, apellido, rol, activo } = req.body;
        
        console.log(`🔄 Actualizando usuario: ${id}`); // Log de inicio
        
        // 2. Verificar que el usuario a actualizar existe
        const usuarioExistente = await Usuario.findById(id);
        if (!usuarioExistente) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }
        
        // 3. **Restricción de seguridad:**
        // Evitar que un administrador intente degradarse a sí mismo (cambiar su rol de 'admin').
        if (id === req.user.id && usuarioExistente.rol === 'admin' && rol && rol !== 'admin') {
            return res.status(400).json({
                error: 'No puedes cambiar tu propio rol de administrador.'
            });
        }
        
        // 4. Llamar al método del modelo para actualizar los campos
        await Usuario.update(id, {
            nombre,
            apellido,
            rol,
            activo
        });
        
        console.log(`✅ Usuario actualizado: ${id}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Usuario actualizado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error actualizando usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar usuario.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para eliminar un usuario.
 * Método HTTP: DELETE /api/usuarios/:id
 * Incluye restricción de seguridad para evitar la auto-eliminación.
 * @param {object} req - Objeto de solicitud de Express (contiene params y req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.eliminarUsuario = async (req, res) => {
    try {
        // 1. Obtener ID del usuario a eliminar
        const { id } = req.params;
        
        console.log(`🗑️ Eliminando usuario: ${id}`); // Log de inicio
        
        // 2. Verificar que el usuario existe
        const usuarioExistente = await Usuario.findById(id);
        if (!usuarioExistente) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }
        
        // 3. **Restricción de seguridad:**
        // Evitar que un usuario intente eliminar su propia cuenta
        if (id === req.user.id) {
            return res.status(400).json({
                error: 'No puedes eliminar tu propia cuenta.'
            });
        }
        
        // 4. Eliminar el usuario
        await Usuario.delete(id);
        
        console.log(`✅ Usuario eliminado: ${id}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Usuario eliminado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error eliminando usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar usuario.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para cambiar la contraseña de un usuario.
 * Método HTTP: PUT /api/usuarios/:id/password
 * Implementa lógica de verificación de contraseña actual para usuarios normales y bypass para admins.
 * @param {object} req - Objeto de solicitud de Express (contiene params, body y req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
usuarioController.cambiarPassword = async (req, res) => {
    try {
        // 1. Obtener ID y contraseñas
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        
        console.log(`🔐 Cambiando password para usuario: ${id}`); // Log de inicio
        
        // 2. Validación de campos requeridos
        if (!newPassword) { // currentPassword solo es requerido para usuarios no-admin
             return res.status(400).json({
                error: 'New password es requerido.'
            });
        }
        
        // 3. Buscar el usuario
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }
        
        // 4. **Lógica de Permisos de Cambio de Contraseña:**
        // A. Permitir si el usuario es él mismo (req.user.id === id).
        // B. Permitir si el usuario es administrador (req.user.rol === 'admin').
        if (req.user.id !== id && req.user.rol !== 'admin') {
            return res.status(403).json({ // 403 Forbidden
                error: 'No tienes permiso para cambiar la contraseña de otro usuario.'
            });
        }
        
        // 5. **Verificación de Contraseña Actual (Solo para usuarios no-admin)**
        if (req.user.rol !== 'admin') {
             if (!currentPassword) {
                 return res.status(400).json({
                     error: 'Current password es requerida para usuarios no-admin.'
                 });
             }
             
            // Compara la contraseña actual proporcionada con la hasheada en la base de datos
            const isValidPassword = await bcrypt.compare(currentPassword, usuario.password);
            if (!isValidPassword) {
                return res.status(401).json({ // 401 Unauthorized
                    error: 'La contraseña actual es incorrecta.'
                });
            }
        }
        
        // 6. Hashear y Actualizar Password
        // Se asume que el modelo no tiene un método updatePassword específico, por lo que se accede a la DB
        const { db } = require('../config/firebase'); 
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection('usuarios').doc(id).update({
            password: hashedPassword,
            fechaActualizacion: new Date()
        });
        
        console.log(`✅ Password actualizado para usuario: ${id}`); // Log de éxito
        
        // 7. Enviar respuesta de éxito
        res.json({
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error cambiando password:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cambiar password.'
        });
    }
};

// Exportar el objeto controlador
module.exports = usuarioController;