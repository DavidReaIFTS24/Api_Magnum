// Importación de modelos necesarios para interactuar con la base de datos
const Pedido = require('../models/pedidoModel'); // Modelo para manejar los datos de los pedidos
const Stock = require('../models/stockModel'); // Modelo para manejar los datos de inventario/stock

// Objeto controlador que contendrá todas las funciones relacionadas con los pedidos
const pedidoController = {};

/**
 * Función controladora para crear un nuevo pedido.
 * Método HTTP: POST /api/pedidos
 * Requiere autenticación y el usuario debe estar inyectado en req.user (por un middleware de auth).
 * @param {object} req - Objeto de solicitud de Express (contiene body y req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
pedidoController.crearPedido = async (req, res) => {
    try {
        // Desestructurar los datos del pedido del cuerpo de la solicitud
        const { cliente, email, telefono, direccion, productos, observaciones } = req.body;

        console.log(`🛒 Creando pedido para: ${cliente}`); // Log de inicio del proceso

        // 1. **Validar Stock** (Verificación crítica antes de crear el pedido)
        for (const item of productos) {
            // Buscar la información de stock para el producto actual
            const stock = await Stock.findByProductoId(item.productoId);
            
            // Verificar si el producto existe en stock o si la cantidad solicitada excede la disponible
            if (!stock || stock.cantidad < item.cantidad) {
                // Si el stock es insuficiente o el producto no tiene registro de stock, devuelve un error 400
                return res.status(400).json({
                    error: `Stock insuficiente para el producto ${item.productoId}`
                });
            }
        }
        
        // 2. **Calcular el Total**
        // Utiliza el método reduce para sumar el precio * cantidad de cada producto
        const total = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // 3. **Crear la instancia del Pedido**
        const pedido = new Pedido({
            cliente,
            email,
            telefono,
            direccion,
            productos,
            total,
            vendedorId: req.user.id, // Asigna el ID del usuario autenticado (vendedor) al pedido
            observaciones
        });
        
        // 4. **Guardar el Pedido en la Base de Datos**
        const pedidoCreado = await pedido.save();
        
        // 5. **Actualizar Stock** (Decrementar las cantidades vendidas)
        for (const item of productos) {
            // Se debe volver a buscar el stock para asegurar la concurrencia (aunque aquí es básico)
            const stock = await Stock.findByProductoId(item.productoId); 
            // Calcular la nueva cantidad
            const nuevaCantidad = stock.cantidad - item.cantidad;
            // Llamar al método del modelo para actualizar la cantidad de stock
            await Stock.updateCantidad(item.productoId, nuevaCantidad);
        }
        
        console.log(`✅ Pedido creado exitosamente: ${pedidoCreado.numero}`); // Log de éxito
        
        // 6. **Enviar Respuesta de Éxito 201 (Created)**
        res.status(201).json({
            message: 'Pedido creado exitosamente',
            pedido: pedidoCreado
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error creando pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear pedido.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener una lista de pedidos.
 * Aplica lógica de permisos: Los 'empleados' ven solo sus pedidos; los 'admins' ven todos.
 * Método HTTP: GET /api/pedidos
 * @param {object} req - Objeto de solicitud de Express (contiene req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
pedidoController.obtenerPedidos = async (req, res) => {
    try {
        let pedidos;
        
        // 1. Lógica de filtrado basada en el rol del usuario autenticado
        if (req.user.rol === 'empleado') {
            // Empleados solo ven los pedidos que ellos mismos crearon (usando su vendedorId)
            pedidos = await Pedido.findByVendedor(req.user.id);
        } else {
            // Admins o cualquier otro rol superior ven todos los pedidos
            pedidos = await Pedido.findAll();
        }
        
        console.log(`✅ Obtenidos ${pedidos.length} pedidos`); // Log de éxito
        
        // 2. Enviar respuesta exitosa
        res.json({
            pedidos
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error obteniendo pedidos:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener pedidos.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para obtener los detalles de un pedido específico por ID.
 * Aplica restricción de acceso para empleados.
 * Método HTTP: GET /api/pedidos/:id
 * @param {object} req - Objeto de solicitud de Express (contiene params y req.user).
 * @param {object} res - Objeto de respuesta de Express.
 */
pedidoController.obtenerPedido = async (req, res) => {
    try {
        // 1. Obtener el ID del pedido desde los parámetros de la URL
        const { id } = req.params;
        
        // 2. Buscar el pedido por ID
        const pedido = await Pedido.findById(id);
        
        // 3. Verificar si el pedido existe
        if (!pedido) {
            // Si no se encuentra, devuelve un error 404 (Not Found)
            return res.status(404).json({
                error: 'Pedido no encontrado.'
            });
        }
        
        // 4. **Lógica de Permisos (Restricción)**
        // Si el usuario es 'empleado' Y el 'vendedorId' del pedido no coincide con su ID
        if (req.user.rol === 'empleado' && pedido.vendedorId !== req.user.id) {
            // Denegar el acceso con un error 403 (Forbidden)
            return res.status(403).json({
                error: 'No tienes permiso para ver este pedido.'
            });
        }
        
        console.log(`✅ Pedido obtenido: ${pedido.numero}`); // Log de éxito
        
        // 5. Enviar respuesta exitosa con el pedido
        res.json({
            pedido
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error obteniendo pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener pedido.'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * Función controladora para actualizar el estado de un pedido.
 * Método HTTP: PUT /api/pedidos/:id/estado
 * @param {object} req - Objeto de solicitud de Express (contiene params y body).
 * @param {object} res - Objeto de respuesta de Express.
 */
pedidoController.actualizarEstado = async (req, res) => {
    try {
        // 1. Obtener ID del pedido y el nuevo estado del cuerpo
        const { id } = req.params;
        const { estado } = req.body;
        
        // 2. Definir una lista de estados válidos permitidos
        const estadosValidos = ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
        
        // 3. Validar que el estado proporcionado sea uno de los permitidos
        if (!estadosValidos.includes(estado)) {
            // Si es inválido, devuelve un error 400 y la lista de estados válidos
            return res.status(400).json({
                error: 'Estado inválido.',
                estadosValidos
            });
        }
        
        // 4. Llamar al método del modelo para actualizar el estado del pedido por ID
        await Pedido.updateEstado(id, estado);
        
        console.log(`✅ Estado de pedido actualizado: ${id} -> ${estado}`); // Log de éxito
        
        // 5. Enviar respuesta de éxito
        res.json({
            message: 'Estado del pedido actualizado exitosamente'
        });
        
    } catch (error) {
        // Manejo de errores internos del servidor
        console.error('❌ Error actualizando estado de pedido:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar estado.'
        });
    }
};

// Exportar el objeto controlador para que pueda ser utilizado por el router
module.exports = pedidoController;