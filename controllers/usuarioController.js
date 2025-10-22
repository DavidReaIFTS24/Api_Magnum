const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

const usuarioController = {};

usuarioController.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    
    // No enviar passwords en la respuesta
    const usuariosSinPassword = usuarios.map(usuario => {
      const { password, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    });
    
    console.log(`✅ Obtenidos ${usuariosSinPassword.length} usuarios`);
    
    res.json({
      usuarios: usuariosSinPassword,
      total: usuariosSinPassword.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener usuarios.'
    });
  }
};

usuarioController.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }
    
    // No enviar password
    const { password, ...usuarioSinPassword } = usuario;
    
    console.log(`✅ Usuario obtenido: ${usuario.email}`);
    
    res.json({
      usuario: usuarioSinPassword
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener usuario.'
    });
  }
};

usuarioController.crearUsuario = async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol } = req.body;
    
    console.log(`👤 Creando usuario: ${email}`);
    
    if (!email || !password || !nombre) {
      return res.status(400).json({
        error: 'Email, password y nombre son requeridos.'
      });
    }
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente) {
      return res.status(409).json({
        error: 'El email ya está registrado.'
      });
    }
    
    const usuario = new Usuario({
      email,
      password,
      nombre,
      apellido,
      rol: rol || 'empleado'
    });
    
    const usuarioCreado = await usuario.save();
    
    // No enviar password en la respuesta
    const { password: _, ...usuarioRespuesta } = usuarioCreado;
    
    console.log(`✅ Usuario creado exitosamente: ${email}`);
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: usuarioRespuesta
    });
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear usuario.'
    });
  }
};

usuarioController.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, rol, activo } = req.body;
    
    console.log(`🔄 Actualizando usuario: ${id}`);
    
    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }
    
    // No permitir que un usuario se quite a sí mismo el rol de admin
    if (id === req.user.id && rol && rol !== 'admin') {
      return res.status(400).json({
        error: 'No puedes cambiar tu propio rol de administrador.'
      });
    }
    
    await Usuario.update(id, {
      nombre,
      apellido,
      rol,
      activo
    });
    
    console.log(`✅ Usuario actualizado: ${id}`);
    
    res.json({
      message: 'Usuario actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar usuario.'
    });
  }
};

usuarioController.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando usuario: ${id}`);
    
    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }
    
    // No permitir que un usuario se elimine a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propia cuenta.'
      });
    }
    
    await Usuario.delete(id);
    
    console.log(`✅ Usuario eliminado: ${id}`);
    
    res.json({
      message: 'Usuario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor al eliminar usuario.'
    });
  }
};

usuarioController.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    console.log(`🔐 Cambiando password para usuario: ${id}`);
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password y new password son requeridos.'
      });
    }
    
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }
    
    // Verificar que el usuario solo pueda cambiar su propio password
    // o que un admin pueda cambiar cualquier password
    if (req.user.id !== id && req.user.rol !== 'admin') {
      return res.status(403).json({
        error: 'No tienes permiso para cambiar la contraseña de otro usuario.'
      });
    }
    
    // Si no es admin, verificar la contraseña actual
    if (req.user.rol !== 'admin') {
      const isValidPassword = await bcrypt.compare(currentPassword, usuario.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'La contraseña actual es incorrecta.'
        });
      }
    }
    
    // Actualizar password
    const { db } = require('../config/firebase');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('usuarios').doc(id).update({
      password: hashedPassword,
      fechaActualizacion: new Date()
    });
    
    console.log(`✅ Password actualizado para usuario: ${id}`);
    
    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error cambiando password:', error);
    res.status(500).json({
      error: 'Error interno del servidor al cambiar password.'
    });
  }
};

module.exports = usuarioController;