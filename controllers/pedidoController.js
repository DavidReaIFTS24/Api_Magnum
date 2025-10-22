const Pedido = require('../models/pedidoModel');
const Stock = require('../models/stockModel');

const pedidoController = {};

pedidoController.crearPedido = async (req, res) => {
  try {
    const { cliente, email, telefono, direccion, productos, observaciones } = req.body;
    
    console.log(`🛒 Creando pedido para: ${cliente}`);
    
    // Validar stock
    for (const item of productos) {
      const stock = await Stock.findByProductoId(item.productoId);
      if (!stock || stock.cantidad < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para el producto ${item.productoId}`
        });
      }
    }
    
    // Calcular total
    const total = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const pedido = new Pedido({
      cliente,
      email,
      telefono,
      direccion,
      productos,
      total,
      vendedorId: req.user.id,
      observaciones
    });
    
    const pedidoCreado = await pedido.save();
    
    // Actualizar stock
    for (const item of productos) {
      const stock = await Stock.findByProductoId(item.productoId);
      const nuevaCantidad = stock.cantidad - item.cantidad;
      await Stock.updateCantidad(item.productoId, nuevaCantidad);
    }
    
    console.log(`✅ Pedido creado exitosamente: ${pedidoCreado.numero}`);
    
    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedido: pedidoCreado
    });
    
  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear pedido.'
    });
  }
};

pedidoController.obtenerPedidos = async (req, res) => {
  try {
    let pedidos;
    
    if (req.user.rol === 'empleado') {
      // Empleados solo ven sus propios pedidos
      pedidos = await Pedido.findByVendedor(req.user.id);
    } else {
      // Admins ven todos los pedidos
      pedidos = await Pedido.findAll();
    }
    
    console.log(`✅ Obtenidos ${pedidos.length} pedidos`);
    
    res.json({
      pedidos
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener pedidos.'
    });
  }
};

pedidoController.obtenerPedido = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findById(id);
    
    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado.'
      });
    }
    
    // Empleados solo pueden ver sus propios pedidos
    if (req.user.rol === 'empleado' && pedido.vendedorId !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permiso para ver este pedido.'
      });
    }
    
    console.log(`✅ Pedido obtenido: ${pedido.numero}`);
    
    res.json({
      pedido
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener pedido.'
    });
  }
};

pedidoController.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
    
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido.',
        estadosValidos
      });
    }
    
    await Pedido.updateEstado(id, estado);
    
    console.log(`✅ Estado de pedido actualizado: ${id} -> ${estado}`);
    
    res.json({
      message: 'Estado del pedido actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando estado de pedido:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar estado.'
    });
  }
};

module.exports = pedidoController;