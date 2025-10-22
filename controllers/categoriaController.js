const Categoria = require('../models/categoriaModel');

const categoriaController = {};

categoriaController.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen } = req.body;
    
    console.log(`📂 Creando categoría: ${nombre}`);
    
    if (!nombre) {
      return res.status(400).json({
        error: 'El nombre de la categoría es requerido.'
      });
    }
    
    const categoria = new Categoria({
      nombre,
      descripcion,
      imagen
    });
    
    const categoriaCreada = await categoria.save();
    
    console.log(`✅ Categoría creada exitosamente: ${nombre}`);
    
    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoria: categoriaCreada
    });
    
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear categoría.'
    });
  }
};

categoriaController.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    
    console.log(`✅ Obtenidas ${categorias.length} categorías`);
    
    res.json({
      categorias,
      total: categorias.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener categorías.'
    });
  }
};

categoriaController.obtenerCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findById(id);
    
    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada.'
      });
    }
    
    console.log(`✅ Categoría obtenida: ${categoria.nombre}`);
    
    res.json({
      categoria
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener categoría.'
    });
  }
};

categoriaController.actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen } = req.body;
    
    console.log(`🔄 Actualizando categoría: ${id}`);
    
    const categoriaExistente = await Categoria.findById(id);
    if (!categoriaExistente) {
      return res.status(404).json({
        error: 'Categoría no encontrada.'
      });
    }
    
    await Categoria.update(id, {
      nombre,
      descripcion,
      imagen
    });
    
    console.log(`✅ Categoría actualizada: ${id}`);
    
    res.json({
      message: 'Categoría actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar categoría.'
    });
  }
};

categoriaController.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando categoría: ${id}`);
    
    const categoriaExistente = await Categoria.findById(id);
    if (!categoriaExistente) {
      return res.status(404).json({
        error: 'Categoría no encontrada.'
      });
    }
    
    await Categoria.delete(id);
    
    console.log(`✅ Categoría eliminada: ${id}`);
    
    res.json({
      message: 'Categoría eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor al eliminar categoría.'
    });
  }
};

module.exports = categoriaController;