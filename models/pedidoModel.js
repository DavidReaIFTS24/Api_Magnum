const { db } = require('../config/firebase');

class Pedido {
  constructor(data) {
    this.cliente = data.cliente;
    this.email = data.email;
    this.telefono = data.telefono;
    this.direccion = data.direccion;
    this.productos = data.productos; // Array de {productoId, cantidad, precio}
    this.total = data.total;
    this.estado = data.estado || 'pendiente'; // pendiente, confirmado, en_proceso, enviado, entregado, cancelado
    this.vendedorId = data.vendedorId;
    this.observaciones = data.observaciones || '';
    this.fechaCreacion = new Date();
  }

  async save() {
    try {
      const pedidoRef = db.collection('pedidos').doc();
      const pedidoData = {
        id: pedidoRef.id,
        numero: await this.generarNumeroPedido(),
        cliente: this.cliente,
        email: this.email,
        telefono: this.telefono,
        direccion: this.direccion,
        productos: this.productos,
        total: this.total,
        estado: this.estado,
        vendedorId: this.vendedorId,
        observaciones: this.observaciones,
        fechaCreacion: this.fechaCreacion
      };
      
      await pedidoRef.set(pedidoData);
      console.log(`✅ Pedido creado: ${pedidoData.numero}`);
      return { id: pedidoRef.id, ...pedidoData };
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      throw error;
    }
  }

  async generarNumeroPedido() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Contar pedidos del mes
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const snapshot = await db.collection('pedidos')
      .where('fechaCreacion', '>=', firstDay)
      .get();
    
    const consecutivo = snapshot.size + 1;
    return `PED-${year}${month}-${String(consecutivo).padStart(4, '0')}`;
  }

  static async findById(id) {
    try {
      const doc = await db.collection('pedidos').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error buscando pedido:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const snapshot = await db.collection('pedidos')
        .orderBy('fechaCreacion', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      throw error;
    }
  }

  static async findByVendedor(vendedorId) {
    try {
      const snapshot = await db.collection('pedidos')
        .where('vendedorId', '==', vendedorId)
        .orderBy('fechaCreacion', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo pedidos por vendedor:', error);
      throw error;
    }
  }

  static async updateEstado(id, nuevoEstado) {
    try {
      await db.collection('pedidos').doc(id).update({
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      });
      console.log(`✅ Estado de pedido actualizado: ${id} -> ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error actualizando estado de pedido:', error);
      throw error;
    }
  }

  static async findByEstado(estado) {
    try {
      const snapshot = await db.collection('pedidos')
        .where('estado', '==', estado)
        .orderBy('fechaCreacion', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error obteniendo pedidos por estado:', error);
      throw error;
    }
  }
}

module.exports = Pedido;