const { db } = require('../config/firebase');

class Stock {
  constructor(data) {
    this.productoId = data.productoId;
    this.cantidad = data.cantidad;
    this.minimo = data.minimo || 5;
    this.ubicacion = data.ubicacion || 'Depósito Principal';
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = new Date();
  }

  async save() {
    try {
      const stockRef = db.collection('stocks').doc();
      const stockData = {
        id: stockRef.id,
        productoId: this.productoId,
        cantidad: this.cantidad,
        minimo: this.minimo,
        ubicacion: this.ubicacion,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await stockRef.set(stockData);
      console.log(`✅ Stock creado para producto: ${this.productoId}`);
      return { id: stockRef.id, ...stockData };
    } catch (error) {
      console.error('❌ Error creando stock:', error);
      throw error;
    }
  }

  static async findByProductoId(productoId) {
    try {
      const snapshot = await db.collection('stocks')
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
      console.error('❌ Error buscando stock:', error);
      throw error;
    }
  }

  static async updateCantidad(productoId, nuevaCantidad) {
    try {
      const stock = await this.findByProductoId(productoId);
      if (!stock) {
        throw new Error('Stock no encontrado');
      }

      await db.collection('stocks').doc(stock.id).update({
        cantidad: nuevaCantidad,
        fechaActualizacion: new Date()
      });
      console.log(`✅ Stock actualizado para producto: ${productoId}`);
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  }

  static async findAllBajoStock() {
    try {
      const snapshot = await db.collection('stocks')
        .where('activo', '==', true)
        .get();
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(stock => stock.cantidad <= stock.minimo);
    } catch (error) {
      console.error('❌ Error obteniendo stock bajo:', error);
      throw error;
    }
  }
}

module.exports = Stock;