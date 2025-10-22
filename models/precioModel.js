const { db } = require('../config/firebase');

class Precio {
  constructor(data) {
    this.productoId = data.productoId;
    this.precio = data.precio;
    this.precioOferta = data.precioOferta || null;
    this.moneda = data.moneda || 'ARS';
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = new Date();
  }

  async save() {
    try {
      // Desactivar precios anteriores del mismo producto
      await db.collection('precios')
        .where('productoId', '==', this.productoId)
        .where('activo', '==', true)
        .get()
        .then(snapshot => {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { activo: false });
          });
          return batch.commit();
        });

      const precioRef = db.collection('precios').doc();
      const precioData = {
        id: precioRef.id,
        productoId: this.productoId,
        precio: this.precio,
        precioOferta: this.precioOferta,
        moneda: this.moneda,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await precioRef.set(precioData);
      console.log(`✅ Precio creado para producto: ${this.productoId}`);
      return { id: precioRef.id, ...precioData };
    } catch (error) {
      console.error('❌ Error creando precio:', error);
      throw error;
    }
  }

  static async findByProductoId(productoId) {
    try {
      const snapshot = await db.collection('precios')
        .where('productoId', '==', productoId)
        .where('activo', '==', true)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando precio:', error);
      throw error;
    }
  }

  static async findHistorialByProductoId(productoId) {
    try {
      const snapshot = await db.collection('precios')
        .where('productoId', '==', productoId)
        .orderBy('fechaCreacion', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo historial de precios:', error);
      throw error;
    }
  }
}

module.exports = Precio;