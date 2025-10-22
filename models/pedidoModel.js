const { db } = require('../config/firebase'); // Importa la instancia de Firestore

/**
 * Clase Modelo para gestionar los Pedidos.
 * Encapsula la lógica de negocio del pedido, la estructura de datos y la interacción con Firestore.
 */
class Pedido {
    /**
     * Constructor para crear una nueva instancia de Pedido.
     * @param {object} data - Objeto con los datos iniciales del pedido.
     */
    constructor(data) {
        // 1. Datos del cliente y envío
        this.cliente = data.cliente;
        this.email = data.email;
        this.telefono = data.telefono;
        this.direccion = data.direccion;
        
        // 2. Detalle de productos y total
        this.productos = data.productos; // Array de {productoId, cantidad, precio}
        this.total = data.total;
        
        // 3. Gestión del estado (por defecto 'pendiente')
        // Estados posibles: pendiente, confirmado, en_proceso, enviado, entregado, cancelado
        this.estado = data.estado || 'pendiente'; 
        
        // 4. Referencia al vendedor/creador
        this.vendedorId = data.vendedorId;
        this.observaciones = data.observaciones || '';
        
        // 5. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operaciones de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Guarda la nueva instancia de Pedido en Firestore.
     * Genera un ID de documento y un número de pedido consecutivo.
     * @returns {object} El objeto del pedido guardado, incluyendo el ID y número.
     */
    async save() {
        try {
            // 1. Generar un nuevo ID de documento
            const pedidoRef = db.collection('pedidos').doc();

            // 2. Generar el número de pedido consecutivo basado en la fecha
            const numeroPedido = await this.generarNumeroPedido();
            
            // 3. Preparar el objeto de datos a guardar
            const pedidoData = {
                id: pedidoRef.id,
                numero: numeroPedido, // Campo único/consecutivo generado
                cliente: this.cliente,
                email: this.email,
                telefono: this.telefono,
                direccion: this.direccion,
                productos: this.productos,
                total: this.total,
                estado: this.estado,
                vendedorId: this.vendedorId,
                observaciones: this.observaciones,
                fechaCreacion: this.fechaCreacion
            };
            
            // 4. Escribir los datos en Firestore
            await pedidoRef.set(pedidoData);
            
            console.log(`✅ Pedido creado: ${pedidoData.numero}`);
            
            // 5. Devolver el pedido con su ID y número
            return { id: pedidoRef.id, ...pedidoData };
            
        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            throw error;
        }
    }

    /**
     * Genera un número de pedido basado en el conteo de pedidos del mes actual.
     * Formato: PED-YYYYMM-XXXX (ej: PED-202510-0015).
     * @returns {string} El número de pedido generado.
     */
    async generarNumeroPedido() {
        const today = new Date();
        const year = today.getFullYear();
        // El mes se paddea a dos dígitos (01-12)
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        // 1. Calcular el primer día del mes para el filtro de la consulta
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // 2. Contar pedidos del mes actual (usando 'fechaCreacion' y consulta)
        const snapshot = await db.collection('pedidos')
            .where('fechaCreacion', '>=', firstDay) // Filtrar por pedidos de este mes
            .get();
        
        // 3. El consecutivo es el tamaño del snapshot + 1
        const consecutivo = snapshot.size + 1;
        
        // 4. Formatear y devolver el número de pedido
        return `PED-${year}${month}-${String(consecutivo).padStart(4, '0')}`;
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura y Modificación)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera un pedido por su ID de documento.
     * @param {string} id - ID del documento del pedido.
     * @returns {object|null} El objeto del pedido encontrado o null si no existe.
     */
    static async findById(id) {
        try {
            const doc = await db.collection('pedidos').doc(id).get();
            if (!doc.exists) {
                return null;
            }
            // Devolver los datos del documento (incluyendo el ID)
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('❌ Error buscando pedido:', error);
            throw error;
        }
    }

    /**
     * Recupera todos los pedidos, ordenados por fecha de creación descendente.
     * @returns {Array<object>} Una lista de objetos de pedidos.
     */
    static async findAll() {
        try {
            const snapshot = await db.collection('pedidos')
                .orderBy('fechaCreacion', 'desc') // Ordenar del más reciente al más antiguo
                .get();
                
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            throw error;
        }
    }

    /**
     * Recupera pedidos asociados a un vendedor específico.
     * @param {string} vendedorId - ID del usuario vendedor.
     * @returns {Array<object>} Una lista de pedidos del vendedor.
     */
    static async findByVendedor(vendedorId) {
        try {
            const snapshot = await db.collection('pedidos')
                .where('vendedorId', '==', vendedorId) // Filtrar por vendedor
                .orderBy('fechaCreacion', 'desc')
                .get();
                
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos por vendedor:', error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de un pedido y registra la fecha de modificación.
     * @param {string} id - ID del documento del pedido a actualizar.
     * @param {string} nuevoEstado - El nuevo estado del pedido.
     */
    static async updateEstado(id, nuevoEstado) {
        try {
            await db.collection('pedidos').doc(id).update({
                estado: nuevoEstado,
                fechaActualizacion: new Date()
            });
            
            console.log(`✅ Estado de pedido actualizado: ${id} -> ${nuevoEstado}`);
        } catch (error) {
            console.error('❌ Error actualizando estado de pedido:', error);
            throw error;
        }
    }

    /**
     * Recupera todos los pedidos que se encuentran en un estado específico.
     * @param {string} estado - El estado por el que filtrar (ej: 'pendiente').
     * @returns {Array<object>} Una lista de pedidos con ese estado.
     */
    static async findByEstado(estado) {
        try {
            const snapshot = await db.collection('pedidos')
                .where('estado', '==', estado) // Filtrar por estado
                .orderBy('fechaCreacion', 'desc')
                .get();
                
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos por estado:', error);
            throw error;
        }
    }
}

module.exports = Pedido; // Exportar la clase modelo