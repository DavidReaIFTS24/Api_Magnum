const Producto = require('../models/productoModel');
const Precio = require('../models/precioModel');
const Stock = require('../models/stockModel');
const Categoria = require('../models/categoriaModel');

const productoController = {};

productoController.crearProducto = async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      categoriaId, 
      material, 
      color, 
      dimensiones, 
      imagen,
      precio,
      cantidadStock
    } = req.body;
    
    console.log(`🛍️ Creando producto: ${nombre}`);
    
    if (!nombre || !categoriaId) {
      return res.status(400).json({
        error: 'Nombre y categoría son requeridos.'
      });
    }
    
    // Verificar que la categoría existe
    const categoria = await Categoria.findById(categoriaId);
    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada.'
      });
    }
    
    const producto = new Producto({
      nombre,
      descripcion,
      categoriaId,
      material,
      color,
      dimensiones,
      imagen
    });
    
    const productoCreado = await producto.save();
    
    // Crear precio inicial si se proporcionó
    if (precio) {
      const precioObj = new Precio({
        productoId: productoCreado.id,
        precio: precio
      });
      await precioObj.save();
    }
    
    // Crear stock inicial si se proporcionó
    if (cantidadStock !== undefined) {
      const stockObj = new Stock({
        productoId: productoCreado.id,
        cantidad: cantidadStock
      });
      await stockObj.save();
    }
    
    console.log(`✅ Producto creado exitosamente: ${nombre}`);
    
    // Obtener producto con información completa
    const productoCompleto = await Producto.findById(productoCreado.id);
    const precioActual = await Precio.findByProductoId(productoCreado.id);
    const stockActual = await Stock.findByProductoId(productoCreado.id);
    
    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: {
        ...productoCompleto,
        precio: precioActual,
        stock: stockActual
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear producto.'
    });
  }
};

productoController.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    
    // Enriquecer productos con precio y stock
    const productosCompletos = await Promise.all(
      productos.map(async (producto) => {
        const precio = await Precio.findByProductoId(producto.id);
        const stock = await Stock.findByProductoId(producto.id);
        return {
          ...producto,
          precio: precio,
          stock: stock
        };
      })
    );
    
    console.log(`✅ Obtenidos ${productosCompletos.length} productos`);
    
    res.json({
      productos: productosCompletos,
      total: productosCompletos.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener productos.'
    });
  }
};

productoController.obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findById(id);
    
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    const precio = await Precio.findByProductoId(id);
    const stock = await Stock.findByProductoId(id);
    const categoria = await Categoria.findById(producto.categoriaId);
    
    console.log(`✅ Producto obtenido: ${producto.nombre}`);
    
    res.json({
      producto: {
        ...producto,
        precio: precio,
        stock: stock,
        categoria: categoria
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener producto.'
    });
  }
};

productoController.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoriaId, material, color, dimensiones, imagen } = req.body;
    
    console.log(`🔄 Actualizando producto: ${id}`);
    
    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    // Verificar categoría si se está actualizando
    if (categoriaId) {
      const categoria = await Categoria.findById(categoriaId);
      if (!categoria) {
        return res.status(404).json({
          error: 'Categoría no encontrada.'
        });
      }
    }
    
    await Producto.update(id, {
      nombre,
      descripcion,
      categoriaId,
      material,
      color,
      dimensiones,
      imagen
    });
    
    console.log(`✅ Producto actualizado: ${id}`);
    
    res.json({
      message: 'Producto actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar producto.'
    });
  }
};

productoController.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando producto: ${id}`);
    
    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado.'
      });
    }
    
    await Producto.delete(id);
    
    console.log(`✅ Producto eliminado: ${id}`);
    
    res.json({
      message: 'Producto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al eliminar producto.'
    });
  }
};

productoController.obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    const productos = await Producto.findByCategoria(categoriaId);
    
    // Enriquecer productos con precio y stock
    const productosCompletos = await Promise.all(
      productos.map(async (producto) => {
        const precio = await Precio.findByProductoId(producto.id);
        const stock = await Stock.findByProductoId(producto.id);
        return {
          ...producto,
          precio: precio,
          stock: stock
        };
      })
    );
    
    console.log(`✅ Obtenidos ${productosCompletos.length} productos para categoría: ${categoriaId}`);
    
    res.json({
      categoriaId,
      productos: productosCompletos,
      total: productosCompletos.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo productos por categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener productos por categoría.'
    });
  }
};

module.exports = productoController;