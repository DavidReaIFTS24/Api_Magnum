const Stock = require('../models/stockModel');
const Producto = require('../models/productoModel');

const stockController = {};

stockController.crearStock = async (req, res) => {
  try {
    const { productoId, cantidad, minimo, ubicacion } = req.body;
    
    console.log(`📦 Creando stock para producto: ${productoId}`);
    
    if (!productoId || cantidad === undefined) {
      return res.status(400).json({
        error: 'productoId y cantidad son requeridos.'
      });
    }
    
    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    // Verificar si ya existe stock para este producto
    const stockExistente = await Stock.findByProductoId(productoId);
    if (stockExistente) {
      return res.status(409).json({
        error: 'Ya existe un registro de stock para este producto.'
      });
    }
    
    const stock = new Stock({
      productoId,
      cantidad,
      minimo,
      ubicacion
    });
    
    const stockCreado = await stock.save();
    
    console.log(`✅ Stock creado exitosamente para producto: ${productoId}`);
    
    res.status(201).json({
      message: 'Stock creado exitosamente',
      stock: stockCreado
    });
    
  } catch (error) {
    console.error('❌ Error creando stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear stock.'
    });
  }
};

stockController.obtenerStockProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const stock = await Stock.findByProductoId(productoId);
    
    if (!stock) {
      return res.status(404).json({
        error: 'Stock no encontrado para este producto.'
      });
    }
    
    console.log(`✅ Stock obtenido para producto: ${productoId}`);
    
    res.json({
      stock
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener stock.'
    });
  }
};

stockController.actualizarStock = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { cantidad, minimo, ubicacion } = req.body;
    
    console.log(`🔄 Actualizando stock para producto: ${productoId}`);
    
    const stockExistente = await Stock.findByProductoId(productoId);
    if (!stockExistente) {
      return res.status(404).json({
        error: 'Stock no encontrado para este producto.'
      });
    }
    
    await Stock.updateCantidad(productoId, cantidad);
    
    // Actualizar otros campos si se proporcionan
    if (minimo !== undefined || ubicacion) {
      const updateData = {};
      if (minimo !== undefined) updateData.minimo = minimo;
      if (ubicacion) updateData.ubicacion = ubicacion;
      
      const { db } = require('../config/firebase');
      await db.collection('stocks').doc(stockExistente.id).update(updateData);
    }
    
    console.log(`✅ Stock actualizado para producto: ${productoId}`);
    
    res.json({
      message: 'Stock actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar stock.'
    });
  }
};

stockController.obtenerStockBajo = async (req, res) => {
  try {
    const stockBajo = await Stock.findAllBajoStock();
    
    // Enriquecer con información del producto
    const stockBajoCompleto = await Promise.all(
      stockBajo.map(async (stock) => {
        const producto = await Producto.findById(stock.productoId);
        return {
          ...stock,
          producto: producto
        };
      })
    );
    
    console.log(`✅ Obtenidos ${stockBajoCompleto.length} productos con stock bajo`);
    
    res.json({
      productosStockBajo: stockBajoCompleto,
      total: stockBajoCompleto.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo stock bajo:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener stock bajo.'
    });
  }
};

stockController.ajustarStock = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { cantidad, tipo, motivo } = req.body; // tipo: 'incrementar' o 'decrementar'
    
    console.log(`📊 Ajustando stock para producto: ${productoId} - ${tipo} ${cantidad}`);
    
    const stockExistente = await Stock.findByProductoId(productoId);
    if (!stockExistente) {
      return res.status(404).json({
        error: 'Stock no encontrado para este producto.'
      });
    }
    
    let nuevaCantidad;
    if (tipo === 'incrementar') {
      nuevaCantidad = stockExistente.cantidad + cantidad;
    } else if (tipo === 'decrementar') {
      nuevaCantidad = stockExistente.cantidad - cantidad;
      if (nuevaCantidad < 0) {
        return res.status(400).json({
          error: 'No hay suficiente stock para realizar esta operación.'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Tipo de ajuste inválido. Use "incrementar" o "decrementar".'
      });
    }
    
    await Stock.updateCantidad(productoId, nuevaCantidad);
    
    // Registrar el movimiento (podrías crear una colección de movimientos de stock)
    console.log(`📝 Movimiento de stock - Producto: ${productoId}, Tipo: ${tipo}, Cantidad: ${cantidad}, Motivo: ${motivo || 'N/A'}`);
    
    console.log(`✅ Stock ajustado para producto: ${productoId}`);
    
    res.json({
      message: 'Stock ajustado exitosamente',
      stockAnterior: stockExistente.cantidad,
      stockNuevo: nuevaCantidad,
      diferencia: tipo === 'incrementar' ? cantidad : -cantidad
    });
    
  } catch (error) {
    console.error('❌ Error ajustando stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor al ajustar stock.'
    });
  }
};

module.exports = stockController;