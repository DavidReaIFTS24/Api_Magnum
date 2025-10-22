const { db } = require('../config/firebase'); // Importa la instancia de Firestore

/**
 * Clase Modelo para gestionar los Productos.
 * Esta clase encapsula la estructura de datos, las reglas de negocio y la interacción con Firestore.
 */
class Producto {
    /**
     * Constructor para crear una nueva instancia de Producto.
     * @param {object} data - Objeto con los datos iniciales del producto.
     */
    constructor(data) {
        // 1. Propiedades básicas del producto
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.categoriaId = data.categoriaId; // Referencia al ID de la categoría
        
        // 2. Atributos descriptivos o técnicos
        this.material = data.material;
        this.color = data.color;
        this.dimensiones = data.dimensiones;
        this.imagen = data.imagen;
        
        // 3. Control de estado: 'activo' por defecto es true (implementación de Soft Delete)
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // 4. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operación de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Guarda la nueva instancia de Producto en Firestore.
     * Genera un ID de documento único.
     * @returns {object} El objeto del producto guardado, incluyendo el ID.
     */
    async save() {
        try {
            // 1. Crear una referencia de documento, dejando que Firestore genere el ID
            const productoRef = db.collection('productos').doc();
            
            // 2. Preparar el objeto de datos a guardar (incluyendo el ID generado)
            const productoData = {
                id: productoRef.id, // Almacenar el ID como un campo dentro del documento
                nombre: this.nombre,
                descripcion: this.descripcion,
                categoriaId: this.categoriaId,
                material: this.material,
                color: this.color,
                dimensiones: this.dimensiones,
                imagen: this.imagen,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 3. Escribir los datos en Firestore
            await productoRef.set(productoData);
            
            console.log(`✅ Producto creado: ${this.nombre}`);
            
            // 4. Devolver el producto con su ID
            return { id: productoRef.id, ...productoData };
            
        } catch (error) {
            console.error('❌ Error creando producto:', error);
            // Re-lanzar el error para ser manejado por el controlador
            throw error; 
        }
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura y Modificación)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera un producto por su ID de documento.
     * @param {string} id - ID del documento del producto.
     * @returns {object|null} El objeto del producto encontrado o null si no existe.
     */
    static async findById(id) {
        try {
            // 1. Obtener el documento por ID
            const doc = await db.collection('productos').doc(id).get();
            
            // 2. Verificar si el documento existe
            if (!doc.exists) {
                return null;
            }
            
            // 3. Devolver los datos del documento (incluyendo el ID)
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando producto:', error);
            throw error;
        }
    }

    /**
     * Recupera todos los productos que están activos.
     * @returns {Array<object>} Una lista de objetos de productos activos.
     */
    static async findAll() {
        try {
            // 1. Crear una consulta para obtener solo documentos donde 'activo' es true
            const snapshot = await db.collection('productos')
                .where('activo', '==', true)
                .get();
                
            // 2. Mapear los documentos a un array de objetos con sus IDs
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw error;
        }
    }

    /**
     * Actualiza uno o más campos de un producto específico.
     * @param {string} id - ID del documento a actualizar.
     * @param {object} data - Objeto con los campos y valores a modificar.
     */
    static async update(id, data) {
        try {
            // 1. Actualizar el documento por ID, añadiendo la fecha de actualización
            await db.collection('productos').doc(id).update({
                ...data, // Esparcir los campos recibidos
                fechaActualizacion: new Date()
            });
            
            console.log(`✅ Producto actualizado: ${id}`);
            
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            throw error;
        }
    }

    /**
     * Realiza una eliminación suave (soft delete) marcando el producto como inactivo.
     * Esto es preferible a la eliminación física para mantener la integridad referencial (ej: pedidos).
     * @param {string} id - ID del documento a eliminar suavemente.
     */
    static async delete(id) {
        try {
            // 1. Actualizar el campo 'activo' a false y registrar la fecha de eliminación
            await db.collection('productos').doc(id).update({
                activo: false,
                fechaEliminacion: new Date()
            });
            
            console.log(`✅ Producto marcado como inactivo: ${id}`);
            
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            throw error;
        }
    }

    /**
     * Recupera todos los productos que pertenecen a una categoría específica y están activos.
     * @param {string} categoriaId - ID de la categoría por la que filtrar.
     * @returns {Array<object>} Una lista de productos de esa categoría.
     */
    static async findByCategoria(categoriaId) {
        try {
            // 1. Consultar productos filtrando por 'categoriaId' y 'activo'
            const snapshot = await db.collection('productos')
                .where('categoriaId', '==', categoriaId)
                .where('activo', '==', true)
                .get();
                
            // 2. Mapear y devolver los productos encontrados
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
        } catch (error) {
            console.error('❌ Error buscando productos por categoría:', error);
            throw error;
        }
    }
}

module.exports = Producto; // Exportar la clase modelo