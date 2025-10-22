// Importación de modelos necesarios
const Producto = require('../models/productoModel'); // Modelo principal del producto
const Precio = require('../models/precioModel');     // Modelo para manejar el precio (historial)
const Stock = require('../models/stockModel');      // Modelo para manejar el stock (inventario)
const Categoria = require('../models/categoriaModel'); // Modelo para validar la existencia de la categoría

// Objeto controlador que agrupa las funciones de manejo de productos
const productoController = {};

/**
 * Función controladora para crear un nuevo producto, su precio inicial y su stock inicial.
 * Método HTTP: POST /api/productos
 * @param {object} req - Objeto de solicitud de Express (contiene el body con datos del producto, precio y stock).
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.crearProducto = async (req, res) => {
    try {
        // 1. Desestructurar todos los datos necesarios del cuerpo de la solicitud
        const { 
            nombre, 
            descripcion, 
            categoriaId, 
            material, 
            color, 
            dimensiones, 
            imagen,
            precio,         // Se utiliza para crear el registro inicial de Precio
            cantidadStock   // Se utiliza para crear el registro inicial de Stock
        } = req.body;
        
        console.log(`🛍️ Creando producto: ${nombre}`); // Log de inicio
        
        // 2. Validación de campos requeridos
        if (!nombre || !categoriaId) {
            return res.status(400).json({
                error: 'Nombre y categoría son requeridos.'
            });
        }
        
        // 3. Verificar que la categoría a la que pertenece el producto existe
        const categoria = await Categoria.findById(categoriaId);
        if (!categoria) {
            return res.status(404).json({
                error: 'Categoría no encontrada.'
            });
        }
        
        // 4. Crear una nueva instancia del modelo Producto
        const producto = new Producto({
            nombre,
            descripcion,
            categoriaId,
            material,
            color,
            dimensiones,
            imagen
        });
        
        // 5. Guardar el producto principal en la base de datos
        const productoCreado = await producto.save();
        
        // 6. Crear precio inicial si se proporcionó
        if (precio) {
            const precioObj = new Precio({
                productoId: productoCreado.id, // Se enlaza con el ID del producto recién creado
                precio: precio
            });
            await precioObj.save();
        }
        
        // 7. Crear stock inicial si se proporcionó (usando !== undefined para aceptar 0)
        if (cantidadStock !== undefined) {
            const stockObj = new Stock({
                productoId: productoCreado.id, // Se enlaza con el ID del producto recién creado
                cantidad: cantidadStock
            });
            await stockObj.save();
        }
        
        console.log(`✅ Producto creado exitosamente: ${nombre}`); // Log de éxito
        
        // 8. Obtener la información completa para la respuesta
        // Es necesario hacer otra búsqueda para incluir los datos que no se pasan en el save inicial
        const productoCompleto = await Producto.findById(productoCreado.id);
        const precioActual = await Precio.findByProductoId(productoCreado.id);
        const stockActual = await Stock.findByProductoId(productoCreado.id);
        
        // 9. Enviar respuesta de éxito 201 con todos los datos combinados
        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: {
                ...productoCompleto, // Spreading los datos base del producto
                precio: precioActual, // Añadiendo el objeto precio
                stock: stockActual // Añadiendo el objeto stock
            }
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error creando producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear producto.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener todos los productos con su precio y stock actuales.
 * Método HTTP: GET /api/productos
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.obtenerProductos = async (req, res) => {
    try {
        // 1. Obtener la lista base de productos
        const productos = await Producto.findAll();
        
        // 2. Enriquecer cada producto con su precio actual y stock
        // Se usa Promise.all para ejecutar todas las promesas de búsqueda de precio/stock en paralelo
        const productosCompletos = await Promise.all(
            productos.map(async (producto) => {
                const precio = await Precio.findByProductoId(producto.id);
                const stock = await Stock.findByProductoId(producto.id);
                return {
                    ...producto, // Spreading los datos base
                    precio: precio, // Añadiendo precio
                    stock: stock // Añadiendo stock
                };
            })
        );
        
        console.log(`✅ Obtenidos ${productosCompletos.length} productos`); // Log de éxito
        
        // 3. Enviar respuesta exitosa con la lista enriquecida
        res.json({
            productos: productosCompletos,
            total: productosCompletos.length
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener productos.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener un único producto por ID con todos sus detalles relacionados.
 * Método HTTP: GET /api/productos/:id
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.obtenerProducto = async (req, res) => {
    try {
        // 1. Obtener el ID del producto
        const { id } = req.params;
        
        // 2. Buscar el producto base
        const producto = await Producto.findById(id);
        
        // 3. Verificar si el producto existe
        if (!producto) {
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 4. Obtener datos relacionados (precio, stock, categoría) en paralelo
        const [precio, stock, categoria] = await Promise.all([
            Precio.findByProductoId(id),
            Stock.findByProductoId(id),
            Categoria.findById(producto.categoriaId)
        ]);
        
        console.log(`✅ Producto obtenido: ${producto.nombre}`); // Log de éxito
        
        // 5. Enviar respuesta exitosa con el objeto producto enriquecido
        res.json({
            producto: {
                ...producto,
                precio: precio,
                stock: stock,
                categoria: categoria // Incluye la información de la categoría
            }
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener producto.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar los datos principales de un producto.
 * Nota: Esta función NO actualiza precio ni stock, que tienen sus propios controladores.
 * Método HTTP: PUT /api/productos/:id
 * @param {object} req - Objeto de solicitud de Express (contiene params y body).
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.actualizarProducto = async (req, res) => {
    try {
        // 1. Obtener ID y datos a actualizar
        const { id } = req.params;
        const { nombre, descripcion, categoriaId, material, color, dimensiones, imagen } = req.body;
        
        console.log(`🔄 Actualizando producto: ${id}`); // Log de inicio
        
        // 2. Verificar que el producto a actualizar existe
        const productoExistente = await Producto.findById(id);
        if (!productoExistente) {
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 3. Verificar la existencia de la nueva categoría si se está cambiando
        if (categoriaId) {
            const categoria = await Categoria.findById(categoriaId);
            if (!categoria) {
                return res.status(404).json({
                    error: 'Categoría no encontrada.'
                });
            }
        }
        
        // 4. Llamar al método del modelo para actualizar los campos principales
        await Producto.update(id, {
            nombre,
            descripcion,
            categoriaId,
            material,
            color,
            dimensiones,
            imagen
        });
        
        console.log(`✅ Producto actualizado: ${id}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Producto actualizado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error actualizando producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar producto.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para eliminar un producto.
 * Nota: Se asume que la eliminación del producto en cascada elimina precio y stock.
 * Método HTTP: DELETE /api/productos/:id
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.eliminarProducto = async (req, res) => {
    try {
        // 1. Obtener ID del producto
        const { id } = req.params;
        
        console.log(`🗑️ Eliminando producto: ${id}`); // Log de inicio
        
        // 2. Verificar que el producto existe
        const productoExistente = await Producto.findById(id);
        if (!productoExistente) {
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 3. Llamar al método del modelo para eliminar el producto
        // Se asume que esto también maneja la eliminación de sus datos relacionados (Precio, Stock)
        await Producto.delete(id);
        
        console.log(`✅ Producto eliminado: ${id}`); // Log de éxito
        
        // 4. Enviar respuesta de éxito
        res.json({
            message: 'Producto eliminado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error eliminando producto:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar producto.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener todos los productos filtrados por una categoría específica.
 * Método HTTP: GET /api/productos/categoria/:categoriaId
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
productoController.obtenerProductosPorCategoria = async (req, res) => {
    try {
        // 1. Obtener el ID de la categoría
        const { categoriaId } = req.params;
        
        // 2. Buscar productos que pertenecen a esa categoría
        const productos = await Producto.findByCategoria(categoriaId);
        
        // 3. Enriquecer cada producto con su precio actual y stock (misma lógica que obtenerProductos)
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
        
        // 4. Enviar respuesta exitosa con la lista filtrada y enriquecida
        res.json({
            categoriaId,
            productos: productosCompletos,
            total: productosCompletos.length
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo productos por categoría:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener productos por categoría.'
        });
    }
};

// Exportar el objeto controlador
module.exports = productoController;