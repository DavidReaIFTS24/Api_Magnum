const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');

const authController = {};

authController.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Intento de login: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password son requeridos.'
      });
    }
    
    const usuario = await Usuario.findByEmail(email);
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        error: 'Credenciales inválidas.'
      });
    }
    
    if (!usuario.activo) {
      console.log('❌ Usuario inactivo');
      return res.status(401).json({
        error: 'Usuario inactivo.'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, usuario.password);
    
    if (!isValidPassword) {
      console.log('❌ Password incorrecto');
      return res.status(401).json({
        error: 'Credenciales inválidas.'
      });
    }
    
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    console.log(`✅ Login exitoso: ${email} (${usuario.rol})`);
    
    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol
      }
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor durante el login.'
    });
  }
};

authController.register = async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol } = req.body;
    
    console.log(`📝 Intento de registro: ${email}`);
    
    // Verificar si el usuario existe
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
    
    // No enviar el password en la respuesta
    delete usuarioCreado.password;
    
    console.log(`✅ Usuario registrado: ${email}`);
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: usuarioCreado
    });
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor durante el registro.'
    });
  }
};

module.exports = authController;