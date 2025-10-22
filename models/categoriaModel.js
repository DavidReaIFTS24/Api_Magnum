const { db } = require('../config/firebase'); // Importa la instancia de Firestore

/**
 * Clase Modelo para gestionar las Categorías de productos.
 * Esta clase encapsula la lógica de negocio y la interacción con la base de datos Firestore.
 */
class Categoria {
    /**
     * Constructor para crear una nueva instancia de Categoría.
     * @param {object} data - Objeto con los datos iniciales de la categoría.
     */
    constructor(data) {
        // 1. Asignación de propiedades
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.imagen = data.imagen;
        // 2. Control de estado: 'activo' por defecto es true, a menos que se especifique lo contrario
        this.activo = data.activo !== undefined ? data.activo : true;
        // 3. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operaciones de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Guarda la nueva instancia de Categoría en Firestore.
     * Genera un ID de documento único.
     * @returns {object} El objeto de la categoría guardada, incluyendo el ID.
     */
    async save() {
        try {
            // 1. Crear una referencia de documento, dejando que Firestore genere el ID
            const categoriaRef = db.collection('categorias').doc();
            
            // 2. Preparar el objeto de datos a guardar (incluyendo el ID generado)
            const categoriaData = {
                id: categoriaRef.id, // Almacenar el ID como un campo dentro del documento
                nombre: this.nombre,
                descripcion: this.descripcion,
                imagen: this.imagen,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 3. Escribir los datos en Firestore
            await categoriaRef.set(categoriaData);
            
            console.log(`✅ Categoría creada: ${this.nombre}`);
            
            // 4. Devolver la categoría con su ID
            return { id: categoriaRef.id, ...categoriaData };
            
        } catch (error) {
            console.error('❌ Error creando categoría:', error);
            // Re-lanzar el error para ser manejado por el controlador
            throw error; 
        }
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura y Modificación)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera una categoría por su ID de documento.
     * @param {string} id - ID del documento de la categoría.
     * @returns {object|null} El objeto de la categoría encontrada o null si no existe.
     */
    static async findById(id) {
        try {
            // 1. Obtener el documento por ID
            const doc = await db.collection('categorias').doc(id).get();
            
            // 2. Verificar si el documento existe
            if (!doc.exists) {
                return null;
            }
            
            // 3. Devolver los datos del documento (incluyendo el ID)
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando categoría:', error);
            throw error;
        }
    }

    /**
     * Recupera todas las categorías que están activas.
     * @returns {Array<object>} Una lista de objetos de categorías activas.
     */
    static async findAll() {
        try {
            // 1. Crear una consulta para obtener solo documentos donde 'activo' es true
            const snapshot = await db.collection('categorias')
                .where('activo', '==', true)
                .get();
                
            // 2. Mapear los documentos a un array de objetos con sus IDs
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
        }
    }

    /**
     * Actualiza uno o más campos de una categoría específica.
     * @param {string} id - ID del documento a actualizar.
     * @param {object} data - Objeto con los campos y valores a modificar.
     */
    static async update(id, data) {
        try {
            // 1. Actualizar el documento por ID, añadiendo la fecha de actualización
            await db.collection('categorias').doc(id).update({
                ...data, // Esparcir los campos recibidos (nombre, descripcion, imagen, etc.)
                fechaActualizacion: new Date()
            });
            
            console.log(`✅ Categoría actualizada: ${id}`);
            
        } catch (error) {
            console.error('❌ Error actualizando categoría:', error);
            throw error;
        }
    }

    /**
     * Realiza una eliminación suave (soft delete) marcando la categoría como inactiva.
     * Esto preserva el historial de la base de datos.
     * @param {string} id - ID del documento a eliminar suavemente.
     */
    static async delete(id) {
        try {
            // 1. Actualizar el campo 'activo' a false y registrar la fecha de eliminación
            await db.collection('categorias').doc(id).update({
                activo: false,
                fechaEliminacion: new Date()
            });
            
            console.log(`✅ Categoría marcada como inactiva: ${id}`);
            
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            throw error;
        }
    }
}

module.exports = Categoria; // Exportar la clase modelo