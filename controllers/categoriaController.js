// Importación del modelo de Categoría para interactuar con la base de datos
const Categoria = require('../models/categoriaModel');

// Objeto controlador que contendrá todas las funciones de manejo de categorías
const categoriaController = {};

/**
 * Función controladora para crear una nueva categoría.
 * Método HTTP: POST /api/categorias
 * @param {object} req - Objeto de solicitud de Express (contiene el body).
 * @param {object} res - Objeto de respuesta de Express.
 */
categoriaController.crearCategoria = async (req, res) => {
    try {
        // Desestructurar los datos de la categoría desde el cuerpo de la solicitud
        const { nombre, descripcion, imagen } = req.body;

        console.log(`📂 Creando categoría: ${nombre}`); // Log de inicio del proceso

        // 1. Validación de campos requeridos
        if (!nombre) {
            // Si falta el nombre, devuelve un error 400 (Bad Request)
            return res.status(400).json({
                error: 'El nombre de la categoría es requerido.'
            });
        }

        // 2. Crear una nueva instancia del modelo Categoria
        const categoria = new Categoria({
            nombre,
            descripcion,
            imagen
        });

        // 3. Guardar la nueva categoría en la base de datos
        // Se asume que 'categoria.save()' maneja la persistencia
        const categoriaCreada = await categoria.save();

        console.log(`✅ Categoría creada exitosamente: ${nombre}`); // Log de éxito

        // 4. Enviar respuesta de éxito 201 (Created) con la categoría creada
        res.status(201).json({
            message: 'Categoría creada exitosamente',
            categoria: categoriaCreada
        });

    } catch (error) {
        // Manejo de errores generales (ej. error de base de datos)
        console.error('❌ Error creando categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear categoría.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener todas las categorías.
 * Método HTTP: GET /api/categorias
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
categoriaController.obtenerCategorias = async (req, res) => {
    try {
        // 1. Buscar todas las categorías en la base de datos
        // Se asume que 'Categoria.findAll()' retorna un array de categorías
        const categorias = await Categoria.findAll();

        console.log(`✅ Obtenidas ${categorias.length} categorías`); // Log de éxito

        // 2. Enviar respuesta exitosa (código 200 por defecto) con las categorías y el total
        res.json({
            categorias,
            total: categorias.length
        });

    } catch (error) {
        // Manejo de errores generales
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener categorías.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener una categoría por su ID.
 * Método HTTP: GET /api/categorias/:id
 * @param {object} req - Objeto de solicitud de Express (contiene 'params').
 * @param {object} res - Objeto de respuesta de Express.
 */
categoriaController.obtenerCategoria = async (req, res) => {
    try {
        // 1. Obtener el ID de la categoría desde los parámetros de la URL
        const { id } = req.params;

        // 2. Buscar la categoría por ID en la base de datos
        // Se asume que 'Categoria.findById(id)' retorna una categoría o null/undefined
        const categoria = await Categoria.findById(id);

        // 3. Verificar si la categoría fue encontrada
        if (!categoria) {
            // Si no se encuentra, devuelve un error 404 (Not Found)
            return res.status(404).json({
                error: 'Categoría no encontrada.'
            });
        }

        console.log(`✅ Categoría obtenida: ${categoria.nombre}`); // Log de éxito

        // 4. Enviar respuesta exitosa con la categoría
        res.json({
            categoria
        });

    } catch (error) {
        // Manejo de errores generales (ej. formato de ID inválido, error de BD)
        console.error('❌ Error obteniendo categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener categoría.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar una categoría por su ID.
 * Método HTTP: PUT /api/categorias/:id
 * @param {object} req - Objeto de solicitud de Express (contiene 'params' y 'body').
 * @param {object} res - Objeto de respuesta de Express.
 */
categoriaController.actualizarCategoria = async (req, res) => {
    try {
        // 1. Obtener el ID de los parámetros y los datos del cuerpo
        const { id } = req.params;
        const { nombre, descripcion, imagen } = req.body;

        console.log(`🔄 Actualizando categoría: ${id}`); // Log de inicio

        // 2. Verificar si la categoría existe antes de intentar actualizar
        const categoriaExistente = await Categoria.findById(id);
        if (!categoriaExistente) {
            // Si no existe, devuelve un error 404
            return res.status(404).json({
                error: 'Categoría no encontrada.'
            });
        }

        // 3. Llamar al método de actualización del modelo
        // Se asume que 'Categoria.update(id, datos)' actualiza los campos proporcionados
        await Categoria.update(id, {
            nombre,
            descripcion,
            imagen
        });

        console.log(`✅ Categoría actualizada: ${id}`); // Log de éxito

        // 4. Enviar respuesta de éxito (generalmente sin contenido, solo un mensaje)
        res.json({
            message: 'Categoría actualizada exitosamente'
        });

    } catch (error) {
        // Manejo de errores generales
        console.error('❌ Error actualizando categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar categoría.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para eliminar una categoría por su ID.
 * Método HTTP: DELETE /api/categorias/:id
 * @param {object} req - Objeto de solicitud de Express (contiene 'params').
 * @param {object} res - Objeto de respuesta de Express.
 */
categoriaController.eliminarCategoria = async (req, res) => {
    try {
        // 1. Obtener el ID de la categoría a eliminar
        const { id } = req.params;

        console.log(`🗑️ Eliminando categoría: ${id}`); // Log de inicio

        // 2. Verificar si la categoría existe antes de intentar eliminar
        const categoriaExistente = await Categoria.findById(id);
        if (!categoriaExistente) {
            // Si no existe, devuelve un error 404
            return res.status(404).json({
                error: 'Categoría no encontrada.'
            });
        }

        // 3. Llamar al método de eliminación del modelo
        // Se asume que 'Categoria.delete(id)' elimina el registro correspondiente
        await Categoria.delete(id);

        console.log(`✅ Categoría eliminada: ${id}`); // Log de éxito

        // 4. Enviar respuesta de éxito (generalmente código 200 o 204 No Content)
        res.json({
            message: 'Categoría eliminada exitosamente'
        });

    } catch (error) {
        // Manejo de errores generales
        console.error('❌ Error eliminando categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar categoría.'
        });
    }
};

// Exportar el objeto controlador para que pueda ser utilizado por el router
module.exports = categoriaController;