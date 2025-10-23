// Importa la instancia de la base de datos de Firebase,
// la cual se asume que está configurada en la ruta '../config/firebase'.
const { db } = require('../config/firebase');

// Importa una utilidad que se encarga de generar IDs autoincrementables.
// Esto es crucial porque Firestore no tiene autoincremento nativo como las DB SQL.
const AutoIncrement = require('../utils/autoIncrement');

// --- Definición de la Clase Modelo 'Categoria' ---
class Categoria {
    // El constructor de la clase. Se llama cuando se crea una nueva instancia de Categoría.
    // Recibe un objeto 'data' con las propiedades iniciales.
    constructor(data) {
        // Asigna los valores de las propiedades principales.
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.imagen = data.imagen;
        
        // Establece 'activo' como 'true' por defecto si no se proporciona en 'data'.
        // Esto es una buena práctica para el 'soft delete' (eliminación lógica).
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // Registra la marca de tiempo de la creación.
        this.fechaCreacion = new Date();
    }

    // --- Método de Instancia: Guardar (Crear) un Nuevo Documento ---
    // Método asíncrono que guarda la instancia actual como un nuevo documento en Firestore.
    async save() {
        try {
            // 1. Generar ID Autoincrementable:
            // Llama a la utilidad 'AutoIncrement' para obtener el siguiente ID secuencial para la colección 'categorias'.
            const categoriaId = await AutoIncrement.generateId('categorias');
            
            // 2. Obtener Referencia del Documento:
            // Obtiene una referencia a un nuevo documento en la colección 'categorias'.
            // Al usar .doc() sin argumentos, Firestore genera un 'ID de documento' único.
            const categoriaRef = db.collection('categorias').doc();
            
            // 3. Preparar los Datos a Guardar:
            // Combina los datos de la instancia con los IDs generados.
            // 'id': El ID autoincrementable (usado para consultas por el usuario/API).
            // 'firestoreId': El ID único generado por Firestore (usado para manipulación interna).
            const categoriaData = {
                id: categoriaId,
                firestoreId: categoriaRef.id,
                nombre: this.nombre,
                descripcion: this.descripcion,
                imagen: this.imagen,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 4. Escribir en Firestore:
            // Usa el método 'set' para crear el documento con los datos preparados.
            await categoriaRef.set(categoriaData);
            
            // 5. Retroalimentación y Retorno:
            console.log(`✅ Categoría creada: ${categoriaId} - ${this.nombre}`);
            // Retorna el ID y los datos completos de la categoría creada.
            return { id: categoriaId, ...categoriaData };
            
        } catch (error) {
            console.error('❌ Error creando categoría:', error);
            // Propaga el error para que sea manejado por el código que llamó a 'save()'.
            throw error;
        }
    }

    // --- Método Estático: Buscar por ID Autoincrementable ---
    // Método de clase para buscar un documento usando el campo 'id' autoincrementable.
    static async findById(id) {
        try {
            // 1. Ejecutar Consulta:
            // Crea una consulta en la colección 'categorias'.
            const snapshot = await db.collection('categorias')
                // Filtra por el campo 'id' (el autoincrementable, NO el firestoreId).
                .where('id', '==', id)
                // Limita la respuesta a un solo documento (ya que 'id' es único).
                .limit(1)
                .get(); // Ejecuta la consulta.
            
            // 2. Verificar Resultado:
            // Si la colección de documentos resultantes está vacía, la categoría no existe.
            if (snapshot.empty) {
                return null;
            }
            
            // 3. Extraer y Retornar Datos:
            // Obtiene el primer (y único) documento.
            const doc = snapshot.docs[0];
            // Retorna un objeto que incluye el 'firestoreId' y todos los datos del documento.
            return { firestoreId: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando categoría:', error);
            throw error;
        }
    }

    // --- Método Estático: Obtener Todas las Categorías Activas ---
    // Método de clase para obtener todas las categorías que no han sido eliminadas lógicamente.
    static async findAll() {
        try {
            // 1. Ejecutar Consulta:
            const snapshot = await db.collection('categorias')
                // Solo trae las categorías donde el campo 'activo' sea 'true'.
                .where('activo', '==', true)
                .get();
                
            // 2. Mapear Resultados:
            // Transforma el array de documentos de Firestore ('snapshot.docs')
            // en un array de objetos JavaScript, incluyendo el 'firestoreId'.
            return snapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
        }
    }

    // --- Método Estático: Actualizar un Documento ---
    // Método de clase para actualizar un documento por su 'id' autoincrementable.
    static async update(id, data) {
        try {
            // 1. Buscar el Documento:
            // Primero se localiza el documento por el 'id' para obtener su 'firestoreId'.
            const snapshot = await db.collection('categorias')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            // 2. Manejar No Encontrado:
            if (snapshot.empty) {
                throw new Error('Categoría no encontrada');
            }
            
            // 3. Obtener Referencia de Actualización:
            const doc = snapshot.docs[0];
            
            // 4. Actualizar en Firestore:
            // Usa el 'firestoreId' (doc.id) para referenciar y actualizar el documento.
            // Utiliza 'update' para modificar solo los campos proporcionados en 'data'
            // y añade una marca de tiempo de actualización.
            await db.collection('categorias').doc(doc.id).update({
                ...data,
                fechaActualizacion: new Date()
            });
            
            // 5. Retroalimentación:
            console.log(`✅ Categoría actualizada: ${id}`);
            
        } catch (error) {
            console.error('❌ Error actualizando categoría:', error);
            throw error;
        }
    }

    // --- Método Estático: Eliminación Lógica (Soft Delete) ---
    // Método de clase para marcar un documento como inactivo en lugar de borrarlo físicamente.
    static async delete(id) {
        try {
            // 1. Buscar el Documento:
            // Similar a 'update', se busca el documento por 'id' para obtener su 'firestoreId'.
            const snapshot = await db.collection('categorias')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            // 2. Manejar No Encontrado:
            if (snapshot.empty) {
                throw new Error('Categoría no encontrada');
            }
            
            // 3. Obtener Referencia de Actualización:
            const doc = snapshot.docs[0];
            
            // 4. Actualizar Estado (Eliminación Lógica):
            // Actualiza el documento para establecer 'activo' en 'false'
            // y registra la fecha de eliminación lógica.
            await db.collection('categorias').doc(doc.id).update({
                activo: false,
                fechaEliminacion: new Date()
            });
            
            // 5. Retroalimentación:
            console.log(`✅ Categoría marcada como inactiva: ${id}`);
            
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            throw error;
        }
    }
}

// Exporta la clase para que pueda ser utilizada en otras partes de la aplicación.
module.exports = Categoria;