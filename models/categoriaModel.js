const { db } = require('../config/firebase');

class Categoria {
  constructor(data) {
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.imagen = data.imagen;
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = new Date();
  }

  async save() {
    try {
      const categoriaRef = db.collection('categorias').doc();
      const categoriaData = {
        id: categoriaRef.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        imagen: this.imagen,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await categoriaRef.set(categoriaData);
      console.log(`✅ Categoría creada: ${this.nombre}`);
      return { id: categoriaRef.id, ...categoriaData };
    } catch (error) {
      console.error('❌ Error creando categoría:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection('categorias').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando categoría:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const snapshot = await db.collection('categorias')
        .where('activo', '==', true)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      await db.collection('categorias').doc(id).update({
        ...data,
        fechaActualizacion: new Date()
      });
      console.log(`✅ Categoría actualizada: ${id}`);
    } catch (error) {
      console.error('❌ Error actualizando categoría:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.collection('categorias').doc(id).update({
        activo: false,
        fechaEliminacion: new Date()
      });
      console.log(`✅ Categoría marcada como inactiva: ${id}`);
    } catch (error) {
      console.error('❌ Error eliminando categoría:', error);
      throw error;
    }
  }
}

module.exports = Categoria;