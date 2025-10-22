// Importación de modelos necesarios
const Precio = require('../models/precioModel'); // Modelo para manejar los registros de precios y su historial
const Producto = require('../models/productoModel'); // Modelo para verificar la existencia del producto

// Objeto controlador que agrupa las funciones de manejo de precios
const precioController = {};

/**
 * Función controladora para crear un nuevo registro de precio para un producto.
 * Nota: En esta implementación, 'crear' y 'actualizar' un precio actual son la misma acción: registrar uno nuevo.
 * Método HTTP: POST /api/precios
 * @param {object} req - Objeto de solicitud de Express (contiene el body).
 * @param {object} res - Objeto de respuesta de Express.
 */
precioController.crearPrecio = async (req, res) => {
    try {
        // Desestructurar los datos del precio del cuerpo de la solicitud
        const { productoId, precio, precioOferta, moneda } = req.body;
        
        console.log(`💰 Creando precio para producto: ${productoId}`); // Log de inicio
        
        // 1. Validación de campos requeridos
        if (!productoId || !precio) {
            // Si falta el ID del producto o el precio base, devuelve un error 400
            return res.status(400).json({
                error: 'productoId y precio son requeridos.'
            });
        }
        
        // 2. Verificar que el producto al que se le asigna el precio realmente existe
        const producto = await Producto.findById(productoId);
        if (!producto) {
            // Si el producto no existe, devuelve un error 404
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 3. Crear una nueva instancia del modelo Precio
        const precioObj = new Precio({
            productoId,
            precio, // Precio base
            precioOferta, // Precio opcional de oferta
            moneda // Moneda del precio
        });
        
        // 4. Guardar el nuevo registro de precio en la base de datos
        // Se asume que el método 'save()' del modelo se encarga de:
        // a) Guardar el nuevo registro.
        // b) Si existe un precio anterior para este producto, marcarlo como inactivo/histórico.
        const precioCreado = await precioObj.save();
        
        console.log(`✅ Precio creado exitosamente para producto: ${productoId}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito 201 (Created)
        res.status(201).json({
            message: 'Precio creado exitosamente',
            precio: precioCreado
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error creando precio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear precio.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener el precio *actual* de un producto.
 * Método HTTP: GET /api/precios/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
precioController.obtenerPrecioProducto = async (req, res) => {
    try {
        // 1. Obtener el productoId de los parámetros de la URL
        const { productoId } = req.params;
        
        // 2. Buscar el precio actual y activo para el producto
        // Se asume que 'Precio.findByProductoId()' solo retorna el último/precio actual/activo
        const precio = await Precio.findByProductoId(productoId);
        
        // 3. Verificar si se encontró un precio
        if (!precio) {
            // Si no hay precio registrado para ese producto, devuelve un error 404
            return res.status(404).json({
                error: 'Precio no encontrado para este producto.'
            });
        }
        
        console.log(`✅ Precio obtenido para producto: ${productoId}`); // Log de éxito
        
        // 4. Enviar respuesta exitosa
        res.json({
            precio
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error obteniendo precio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener precio.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener el historial completo de precios de un producto.
 * Método HTTP: GET /api/precios/historial/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
precioController.obtenerHistorialPrecios = async (req, res) => {
    try {
        // 1. Obtener el productoId de los parámetros de la URL
        const { productoId } = req.params;
        
        // 2. Buscar todos los registros de precio (activos e históricos) para el producto
        // Se asume que 'Precio.findHistorialByProductoId()' retorna un array
        const historial = await Precio.findHistorialByProductoId(productoId);
        
        console.log(`✅ Historial de precios obtenido: ${historial.length} registros`); // Log de éxito
        
        // 3. Enviar respuesta exitosa con el historial de precios
        res.json({
            productoId,
            historial,
            total: historial.length
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error obteniendo historial de precios:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener historial de precios.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar el precio de un producto.
 * En esta implementación, la 'actualización' se logra creando un nuevo registro (ver crearPrecio).
 * Método HTTP: PUT /api/precios/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params y body).
 * @param {object} res - Objeto de respuesta de Express.
 */
precioController.actualizarPrecio = async (req, res) => {
    try {
        // 1. Obtener el productoId de los parámetros y los nuevos datos del cuerpo
        const { productoId } = req.params;
        const { precio, precioOferta, moneda } = req.body;
        
        console.log(`🔄 Actualizando precio para producto: ${productoId}`); // Log de inicio
        
        // 2. Verificar que el producto existe antes de registrar un nuevo precio
        const producto = await Producto.findById(productoId);
        if (!producto) {
            // Si el producto no existe, devuelve un error 404
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 3. Crear una nueva instancia del modelo Precio con los nuevos valores
        // Esta acción, internamente en el modelo (se asume), desactiva el precio anterior.
        const precioObj = new Precio({
            productoId,
            precio,
            precioOferta,
            moneda
        });
        
        // 4. Guardar el nuevo registro, marcándolo como el precio actual
        const precioActualizado = await precioObj.save();
        
        console.log(`✅ Precio actualizado para producto: ${productoId}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Precio actualizado exitosamente',
            precio: precioActualizado // Devuelve el nuevo registro creado
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error actualizando precio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar precio.'
        });
    }
};

// Exportar el objeto controlador
module.exports = precioController;