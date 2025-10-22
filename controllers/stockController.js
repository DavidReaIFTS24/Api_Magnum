// Importación de modelos necesarios
const Stock = require('../models/stockModel'); // Modelo para manejar el registro de stock/inventario
const Producto = require('../models/productoModel'); // Modelo para verificar la existencia del producto

// Objeto controlador que agrupa las funciones de manejo de stock
const stockController = {};

/**
 * Función controladora para crear el registro de stock inicial de un producto.
 * Nota: Solo permite un registro de stock por producto.
 * Método HTTP: POST /api/stock
 * @param {object} req - Objeto de solicitud de Express (contiene el body).
 * @param {object} res - Objeto de respuesta de Express.
 */
stockController.crearStock = async (req, res) => {
    try {
        // 1. Desestructurar los datos del stock del cuerpo de la solicitud
        const { productoId, cantidad, minimo, ubicacion } = req.body;
        
        console.log(`📦 Creando stock para producto: ${productoId}`); // Log de inicio
        
        // 2. Validación de campos requeridos (cantidad se usa 'undefined' para aceptar 0)
        if (!productoId || cantidad === undefined) {
            return res.status(400).json({
                error: 'productoId y cantidad son requeridos.'
            });
        }
        
        // 3. Verificar que el producto al que se le asigna el stock existe
        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }
        
        // 4. Verificar si ya existe un registro de stock para este producto
        // Esto previene que se creen múltiples registros de inventario para el mismo producto.
        const stockExistente = await Stock.findByProductoId(productoId);
        if (stockExistente) {
            return res.status(409).json({ // 409 Conflict
                error: 'Ya existe un registro de stock para este producto.'
            });
        }
        
        // 5. Crear una nueva instancia del modelo Stock
        const stock = new Stock({
            productoId,
            cantidad,
            minimo, // Nivel mínimo de stock (para alertas)
            ubicacion // Ubicación física en el almacén
        });
        
        // 6. Guardar el nuevo registro de stock en la base de datos
        const stockCreado = await stock.save();
        
        console.log(`✅ Stock creado exitosamente para producto: ${productoId}`); // Log de éxito
        
        // 7. Enviar respuesta de éxito 201 (Created)
        res.status(201).json({
            message: 'Stock creado exitosamente',
            stock: stockCreado
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error creando stock:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear stock.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener el registro de stock actual de un producto.
 * Método HTTP: GET /api/stock/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params).
 * @param {object} res - Objeto de respuesta de Express.
 */
stockController.obtenerStockProducto = async (req, res) => {
    try {
        // 1. Obtener el productoId de los parámetros de la URL
        const { productoId } = req.params;
        
        // 2. Buscar el registro de stock por ID de producto
        const stock = await Stock.findByProductoId(productoId);
        
        // 3. Verificar si se encontró el stock
        if (!stock) {
            return res.status(404).json({
                error: 'Stock no encontrado para este producto.'
            });
        }
        
        console.log(`✅ Stock obtenido para producto: ${productoId}`); // Log de éxito
        
        // 4. Enviar respuesta exitosa con el objeto stock
        res.json({
            stock
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo stock:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener stock.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar el stock (cantidad, mínimo, ubicación) de un producto.
 * Método HTTP: PUT /api/stock/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params y body).
 * @param {object} res - Objeto de respuesta de Express.
 */
stockController.actualizarStock = async (req, res) => {
    try {
        // 1. Obtener ID del producto y los datos a actualizar
        const { productoId } = req.params;
        const { cantidad, minimo, ubicacion } = req.body;
        
        console.log(`🔄 Actualizando stock para producto: ${productoId}`); // Log de inicio
        
        // 2. Verificar que el registro de stock existe
        const stockExistente = await Stock.findByProductoId(productoId);
        if (!stockExistente) {
            return res.status(404).json({
                error: 'Stock no encontrado para este producto.'
            });
        }
        
        // 3. Actualizar la cantidad (si se proporciona)
        // Se asume que Stock.updateCantidad solo actualiza el campo 'cantidad'
        if (cantidad !== undefined) {
            await Stock.updateCantidad(productoId, cantidad);
        }
        
        // 4. Actualizar otros campos (mínimo, ubicación) si se proporcionan
        if (minimo !== undefined || ubicacion) {
            const updateData = {};
            if (minimo !== undefined) updateData.minimo = minimo;
            if (ubicacion) updateData.ubicacion = ubicacion;
            
            // Nota: Aquí hay un acoplamiento al código de Firebase. Se usa el ID del documento
            // (stockExistente.id) para actualizar campos adicionales directamente.
            const { db } = require('../config/firebase');
            await db.collection('stocks').doc(stockExistente.id).update(updateData);
        }
        
        console.log(`✅ Stock actualizado para producto: ${productoId}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Stock actualizado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error actualizando stock:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar stock.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener una lista de productos cuyo stock está por debajo del mínimo.
 * Método HTTP: GET /api/stock/bajo
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
stockController.obtenerStockBajo = async (req, res) => {
    try {
        // 1. Obtener todos los registros de stock que cumplen la condición (cantidad < minimo)
        // Se asume que 'Stock.findAllBajoStock()' implementa la lógica de filtrado
        const stockBajo = await Stock.findAllBajoStock();
        
        // 2. Enriquecer los resultados con la información del producto
        const stockBajoCompleto = await Promise.all(
            stockBajo.map(async (stock) => {
                // Buscar la información detallada del producto
                const producto = await Producto.findById(stock.productoId);
                return {
                    ...stock, // Datos del registro de stock
                    producto: producto // Datos del producto asociado
                };
            })
        );
        
        console.log(`✅ Obtenidos ${stockBajoCompleto.length} productos con stock bajo`); // Log de éxito
        
        // 3. Enviar respuesta exitosa
        res.json({
            productosStockBajo: stockBajoCompleto,
            total: stockBajoCompleto.length
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error obteniendo stock bajo:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener stock bajo.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para realizar ajustes manuales al stock (incremento/decremento).
 * Método HTTP: POST /api/stock/ajustar/:productoId
 * @param {object} req - Objeto de solicitud de Express (contiene params y body).
 * @param {object} res - Objeto de respuesta de Express.
 */
stockController.ajustarStock = async (req, res) => {
    try {
        // 1. Obtener ID del producto y los parámetros del ajuste
        const { productoId } = req.params;
        // Cantidad a sumar/restar, tipo de operación, y motivo para el log/historial
        const { cantidad, tipo, motivo } = req.body; 
        
        console.log(`📊 Ajustando stock para producto: ${productoId} - ${tipo} ${cantidad}`); // Log de inicio
        
        // 2. Verificar que el registro de stock existe
        const stockExistente = await Stock.findByProductoId(productoId);
        if (!stockExistente) {
            return res.status(404).json({
                error: 'Stock no encontrado para este producto.'
            });
        }
        
        let nuevaCantidad;
        
        // 3. Lógica para calcular la nueva cantidad basada en el tipo de ajuste
        if (tipo === 'incrementar') {
            nuevaCantidad = stockExistente.cantidad + cantidad;
        } else if (tipo === 'decrementar') {
            nuevaCantidad = stockExistente.cantidad - cantidad;
            // Prevenir stock negativo
            if (nuevaCantidad < 0) {
                return res.status(400).json({
                    error: 'No hay suficiente stock para realizar esta operación.'
                });
            }
        } else {
            // Tipo de ajuste inválido
            return res.status(400).json({
                error: 'Tipo de ajuste inválido. Use "incrementar" o "decrementar".'
            });
        }
        
        // 4. Actualizar la cantidad final en la base de datos
        await Stock.updateCantidad(productoId, nuevaCantidad);
        
        // 5. Registrar el movimiento (simulado con un log aquí; idealmente en una tabla de 'MovimientosStock')
        console.log(`📝 Movimiento de stock - Producto: ${productoId}, Tipo: ${tipo}, Cantidad: ${cantidad}, Motivo: ${motivo || 'N/A'}`);
        
        console.log(`✅ Stock ajustado para producto: ${productoId}`); // Log de éxito
        
        // 6. Enviar respuesta de éxito con la información del cambio
        res.json({
            message: 'Stock ajustado exitosamente',
            stockAnterior: stockExistente.cantidad,
            stockNuevo: nuevaCantidad,
            diferencia: tipo === 'incrementar' ? cantidad : -cantidad
        });
        
    } catch (error) {
        // Manejo de errores
        console.error('❌ Error ajustando stock:', error);
        res.status(500).json({
            error: 'Error interno del servidor al ajustar stock.'
        });
    }
};

// Exportar el objeto controlador
module.exports = stockController;