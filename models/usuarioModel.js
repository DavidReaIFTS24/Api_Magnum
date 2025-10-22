const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

class Usuario {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.rol = data.rol || 'empleado'; // 'admin' o 'empleado'
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = new Date();
  }

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  async save() {
    try {
      await this.hashPassword();
      const usuarioRef = db.collection('usuarios').doc();
      const usuarioData = {
        id: usuarioRef.id,
        email: this.email,
        password: this.password,
        nombre: this.nombre,
        apellido: this.apellido,
        rol: this.rol,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await usuarioRef.set(usuarioData);
      console.log(`✅ Usuario creado: ${this.email}`);
      return { id: usuarioRef.id, ...usuarioData };
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('usuarios')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando usuario:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection('usuarios').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando usuario por ID:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const snapshot = await db.collection('usuarios').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      // No permitir cambiar el password directamente
      if (data.password) {
        delete data.password;
      }
      
      await db.collection('usuarios').doc(id).update({
        ...data,
        fechaActualizacion: new Date()
      });
      console.log(`✅ Usuario actualizado: ${id}`);
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.collection('usuarios').doc(id).update({
        activo: false,
        fechaEliminacion: new Date()
      });
      console.log(`✅ Usuario marcado como inactivo: ${id}`);
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      throw error;
    }
  }
}

module.exports = Usuario;