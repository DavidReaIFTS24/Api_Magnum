const Precio = require('../models/precioModel');
const Producto = require('../models/productoModel');

const precioController = {};

precioController.crearPrecio = async (req, res) => {
  try {
    const { productoId, precio, precioOferta, moneda } = req.body;
    
    console.log(`💰 Creando precio para producto: ${productoId}`);
    
    if (!productoId || !precio) {
      return res.status(400).json({
        error: 'productoId y precio son requeridos.'
      });
    }
    
    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    const precioObj = new Precio({
      productoId,
      precio,
      precioOferta,
      moneda
    });
    
    const precioCreado = await precioObj.save();
    
    console.log(`✅ Precio creado exitosamente para producto: ${productoId}`);
    
    res.status(201).json({
      message: 'Precio creado exitosamente',
      precio: precioCreado
    });
    
  } catch (error) {
    console.error('❌ Error creando precio:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear precio.'
    });
  }
};

precioController.obtenerPrecioProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const precio = await Precio.findByProductoId(productoId);
    
    if (!precio) {
      return res.status(404).json({
        error: 'Precio no encontrado para este producto.'
      });
    }
    
    console.log(`✅ Precio obtenido para producto: ${productoId}`);
    
    res.json({
      precio
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo precio:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener precio.'
    });
  }
};

precioController.obtenerHistorialPrecios = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const historial = await Precio.findHistorialByProductoId(productoId);
    
    console.log(`✅ Historial de precios obtenido: ${historial.length} registros`);
    
    res.json({
      productoId,
      historial,
      total: historial.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo historial de precios:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener historial de precios.'
    });
  }
};

precioController.actualizarPrecio = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { precio, precioOferta, moneda } = req.body;
    
    console.log(`🔄 Actualizando precio para producto: ${productoId}`);
    
    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    // Crear nuevo precio (que automáticamente desactiva el anterior)
    const precioObj = new Precio({
      productoId,
      precio,
      precioOferta,
      moneda
    });
    
    const precioActualizado = await precioObj.save();
    
    console.log(`✅ Precio actualizado para producto: ${productoId}`);
    
    res.json({
      message: 'Precio actualizado exitosamente',
      precio: precioActualizado
    });
    
  } catch (error) {
    console.error('❌ Error actualizando precio:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar precio.'
    });
  }
};

module.exports = precioController;