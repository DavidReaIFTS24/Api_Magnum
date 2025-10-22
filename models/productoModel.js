const { db } = require('../config/firebase');

class Producto {
  constructor(data) {
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.categoriaId = data.categoriaId;
    this.material = data.material;
    this.color = data.color;
    this.dimensiones = data.dimensiones;
    this.imagen = data.imagen;
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = new Date();
  }

  async save() {
    try {
      const productoRef = db.collection('productos').doc();
      const productoData = {
        id: productoRef.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        categoriaId: this.categoriaId,
        material: this.material,
        color: this.color,
        dimensiones: this.dimensiones,
        imagen: this.imagen,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await productoRef.set(productoData);
      console.log(`✅ Producto creado: ${this.nombre}`);
      return { id: productoRef.id, ...productoData };
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection('productos').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando producto:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const snapshot = await db.collection('productos')
        .where('activo', '==', true)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      await db.collection('productos').doc(id).update({
        ...data,
        fechaActualizacion: new Date()
      });
      console.log(`✅ Producto actualizado: ${id}`);
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.collection('productos').doc(id).update({
        activo: false,
        fechaEliminacion: new Date()
      });
      console.log(`✅ Producto marcado como inactivo: ${id}`);
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  }

  static async findByCategoria(categoriaId) {
    try {
      const snapshot = await db.collection('productos')
        .where('categoriaId', '==', categoriaId)
        .where('activo', '==', true)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error buscando productos por categoría:', error);
      throw error;
    }
  }
}

module.exports = Producto;