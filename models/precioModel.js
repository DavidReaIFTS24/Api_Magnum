const { db } = require('../config/firebase'); // Importa la instancia de Firestore

/**
 * Clase Modelo para gestionar el Historial de Precios de los Productos.
 * Cada instancia representa una versión del precio de un producto.
 * Implementa un mecanismo para mantener solo un precio activo por producto.
 */
class Precio {
    /**
     * Constructor para crear una nueva instancia de Precio.
     * @param {object} data - Objeto con los datos iniciales del precio.
     */
    constructor(data) {
        // 1. Asignación de propiedades
        this.productoId = data.productoId;
        this.precio = data.precio;
        this.precioOferta = data.precioOferta || null; // Opcional, por defecto null
        this.moneda = data.moneda || 'ARS'; // Moneda por defecto: Pesos Argentinos
        
        // 2. Control de estado: 'activo' por defecto es true. Solo un precio puede estar activo.
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // 3. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operaciones de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Guarda la nueva instancia de Precio en Firestore, desactivando primero
     * cualquier precio activo anterior para el mismo producto.
     * Esto garantiza que solo haya un precio actual.
     * @returns {object} El objeto del precio guardado, incluyendo el ID.
     */
    async save() {
        try {
            // 1. Desactivar precios anteriores del mismo producto (Mecanismo de Historial/Transaccionalidad)
            // Se realiza una consulta para encontrar todos los precios activos del producto
            await db.collection('precios')
                .where('productoId', '==', this.productoId)
                .where('activo', '==', true)
                .get()
                .then(snapshot => {
                    const batch = db.batch(); // Iniciar un batch para operaciones atómicas
                    
                    // Para cada documento activo encontrado, prepararlo para ser desactivado
                    snapshot.docs.forEach(doc => {
                        batch.update(doc.ref, { activo: false });
                    });
                    
                    // Ejecutar el batch (desactivar todos los precios antiguos)
                    return batch.commit();
                });

            // 2. Crear una referencia de documento para el nuevo precio
            const precioRef = db.collection('precios').doc();
            
            // 3. Preparar los datos del nuevo precio (que será el único activo)
            const precioData = {
                id: precioRef.id,
                productoId: this.productoId,
                precio: this.precio,
                precioOferta: this.precioOferta,
                moneda: this.moneda,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 4. Guardar el nuevo precio en la base de datos
            await precioRef.set(precioData);
            
            console.log(`✅ Precio creado para producto: ${this.productoId}`);
            
            // 5. Devolver el nuevo registro de precio
            return { id: precioRef.id, ...precioData };
            
        } catch (error) {
            console.error('❌ Error creando precio:', error);
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera el precio *activo* actual de un producto.
     * @param {string} productoId - ID del producto.
     * @returns {object|null} El objeto del precio activo o null si no hay ninguno.
     */
    static async findByProductoId(productoId) {
        try {
            // 1. Buscar el precio filtrando por productoId y estado activo
            const snapshot = await db.collection('precios')
                .where('productoId', '==', productoId)
                .where('activo', '==', true)
                .limit(1) // Solo necesitamos uno (debería ser único)
                .get();
            
            // 2. Si el snapshot está vacío, no hay precio activo
            if (snapshot.empty) {
                return null;
            }
            
            // 3. Devolver el primer y único documento encontrado
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando precio:', error);
            throw error;
        }
    }

    /**
     * Busca y recupera el historial completo de precios (activos e inactivos) de un producto.
     * @param {string} productoId - ID del producto.
     * @returns {Array<object>} Lista de todos los registros de precio del producto.
     */
    static async findHistorialByProductoId(productoId) {
        try {
            // 1. Consultar todos los registros de precio para el producto
            const snapshot = await db.collection('precios')
                .where('productoId', '==', productoId)
                .orderBy('fechaCreacion', 'desc') // Ordenar cronológicamente (más reciente primero)
                .get();
            
            // 2. Mapear y devolver el historial
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
        } catch (error) {
            console.error('❌ Error obteniendo historial de precios:', error);
            throw error;
        }
    }
}

module.exports = Precio; // Exportar la clase modelo