const { db } = require('../config/firebase'); // Importa la instancia de Firestore

/**
 * Clase Modelo para gestionar el Stock/Inventario de los Productos.
 * Cada instancia representa el registro de stock actual y único de un producto.
 */
class Stock {
    /**
     * Constructor para crear una nueva instancia de Stock.
     * @param {object} data - Objeto con los datos iniciales de stock.
     */
    constructor(data) {
        // 1. Propiedades principales de stock
        this.productoId = data.productoId;
        this.cantidad = data.cantidad;
        
        // 2. Parámetros de gestión
        this.minimo = data.minimo || 5; // Nivel de stock mínimo para generar alertas (por defecto 5)
        this.ubicacion = data.ubicacion || 'Depósito Principal'; // Ubicación física
        
        // 3. Control de estado: 'activo' por defecto es true (solo debe haber un registro activo por producto)
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // 4. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operación de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Guarda la nueva instancia de Stock en Firestore.
     * Esto generalmente se utiliza para crear el registro de inventario inicial.
     * @returns {object} El objeto de stock guardado, incluyendo el ID.
     */
    async save() {
        try {
            // 1. Crear una referencia de documento, dejando que Firestore genere el ID
            const stockRef = db.collection('stocks').doc();
            
            // 2. Preparar el objeto de datos a guardar
            const stockData = {
                id: stockRef.id,
                productoId: this.productoId,
                cantidad: this.cantidad,
                minimo: this.minimo,
                ubicacion: this.ubicacion,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 3. Escribir los datos en Firestore
            await stockRef.set(stockData);
            
            console.log(`✅ Stock creado para producto: ${this.productoId}`);
            
            // 4. Devolver el registro con su ID
            return { id: stockRef.id, ...stockData };
            
        } catch (error) {
            console.error('❌ Error creando stock:', error);
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura y Modificación)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera el registro de stock *activo* actual para un producto específico.
     * Asume que solo existe un registro activo por producto.
     * @param {string} productoId - ID del producto.
     * @returns {object|null} El objeto de stock activo o null si no existe.
     */
    static async findByProductoId(productoId) {
        try {
            // 1. Buscar el registro de stock filtrando por productoId y estado activo
            const snapshot = await db.collection('stocks')
                .where('productoId', '==', productoId)
                .where('activo', '==', true)
                .limit(1) // Solo se espera un resultado
                .get();
            
            // 2. Si no hay stock activo, devolver null
            if (snapshot.empty) {
                return null;
            }
            
            // 3. Devolver el registro encontrado
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando stock:', error);
            throw error;
        }
    }

    /**
     * Actualiza la cantidad de stock de un producto.
     * Este es el método principal para registrar ventas, entradas o ajustes.
     * @param {string} productoId - ID del producto cuyo stock se va a modificar.
     * @param {number} nuevaCantidad - La nueva cantidad total de stock.
     */
    static async updateCantidad(productoId, nuevaCantidad) {
        try {
            // 1. Obtener el registro de stock actual para su ID de documento
            const stock = await this.findByProductoId(productoId);
            
            if (!stock) {
                // Lanzar un error si el registro de stock no existe
                throw new Error('Stock no encontrado');
            }

            // 2. Actualizar el campo 'cantidad' y la fecha de actualización
            await db.collection('stocks').doc(stock.id).update({
                cantidad: nuevaCantidad,
                fechaActualizacion: new Date()
            });
            
            console.log(`✅ Stock actualizado para producto: ${productoId}`);
            
        } catch (error) {
            console.error('❌ Error actualizando stock:', error);
            throw error;
        }
    }

    /**
     * Obtiene una lista de todos los productos cuyo stock actual es menor o igual al nivel mínimo definido.
     * @returns {Array<object>} Una lista de registros de stock bajo.
     */
    static async findAllBajoStock() {
        try {
            // 1. Obtener todos los registros de stock activos
            // Nota: No es posible hacer directamente 'where cantidad < minimo' en Firestore.
            const snapshot = await db.collection('stocks')
                .where('activo', '==', true)
                .get();
            
            // 2. Mapear los documentos y luego filtrarlos en el servidor de la aplicación (lógica de negocio)
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(stock => stock.cantidad <= stock.minimo); // Filtrado lógico: cantidad <= mínimo
                
        } catch (error) {
            console.error('❌ Error obteniendo stock bajo:', error);
            throw error;
        }
    }
}

module.exports = Stock; // Exportar la clase modelo