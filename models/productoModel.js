// Importa la instancia de la base de datos de Firebase configurada.
const { db } = require('../config/firebase'); 
// Importa la utilidad para generar IDs numéricos secuenciales (Autoincremento).
const AutoIncrement = require('../utils/autoIncrement'); 

// --- Definición de la Clase Modelo 'Producto' ---
class Producto {
  // El constructor inicializa una nueva instancia de Producto con los datos recibidos.
  constructor(data) {
    // Propiedades básicas del producto.
    this.nombre = data.nombre; 
    this.descripcion = data.descripcion; 
    // Referencia al ID de la categoría a la que pertenece el producto.
    this.categoriaId = data.categoriaId; 
    this.material = data.material; 
    this.color = data.color; 
    this.dimensiones = data.dimensiones; 
    this.imagen = data.imagen; 
    // El producto se marca como activo por defecto, si no se especifica. Se utiliza para soft delete.
    this.activo = data.activo !== undefined ? data.activo : true; 
    // Registra el momento de la creación del producto.
    this.fechaCreacion = new Date(); 
  }

  // --- Método de Instancia: Guardar (Crear) un Nuevo Documento ---
  // Guarda la instancia actual como un nuevo documento en la colección 'productos' de Firestore.
  async save() {
    try {
      // Genera el próximo ID numérico secuencial para el campo 'id'.
      const productId = await AutoIncrement.generateId('productos'); 
      // Obtiene una referencia a un nuevo documento de Firestore (generando un firestoreId).
      const productoRef = db.collection('productos').doc(); 
      
      // Objeto con todos los datos a persistir en la base de datos.
      const productoData = {
        id: productId, // El ID numérico (fácil de usar en la URL/API).
        firestoreId: productoRef.id, // El ID único de Firestore (para manipulación interna).
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
      
      await productoRef.set(productoData); // Escribe el documento en Firestore.
      console.log(`✅ Producto creado: ${productId} - ${this.nombre}`); // Log de éxito.
      // Devuelve el producto guardado, incluyendo el nuevo ID.
      return { id: productId, ...productoData }; 
    } catch (error) {
      console.error('❌ Error creando producto:', error); // Manejo de error.
      throw error; 
    }
  }

  // --- Método Estático: Buscar por ID Autoincrementable ---
  // Busca un producto usando el campo 'id' numérico de la aplicación.
  static async findById(id) {
    try {
      const snapshot = await db.collection('productos') // Accede a la colección.
        .where('id', '==', id) // Filtra por el ID numérico.
        .limit(1) // Optimiza la consulta esperando un solo resultado.
        .get(); 
      
      if (snapshot.empty) { // Si no hay resultados, devuelve null.
        return null;
      }
      
      const doc = snapshot.docs[0]; // Obtiene el primer (y único) documento.
      // Retorna los datos del documento junto con su ID de Firestore.
      return { firestoreId: doc.id, ...doc.data() }; 
    } catch (error) {
      console.error('❌ Error buscando producto:', error);
      throw error;
    }
  }

  // --- Método Estático: Obtener Todos los Productos Activos ---
  static async findAll() {
    try {
      const snapshot = await db.collection('productos')
        .where('activo', '==', true) // Filtra para obtener solo los productos no eliminados lógicamente.
        .get();
      // Mapea los resultados a un array de objetos JavaScript.
      return snapshot.docs.map(doc => ({ 
        firestoreId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      throw error;
    }
  }

  // --- Método Estático: Actualizar un Producto ---
  // Actualiza los campos de un producto específico por su 'id' numérico.
  static async update(id, data) {
    try {
      // Busca el producto por 'id' para obtener la referencia de Firestore.
      const snapshot = await db.collection('productos')
        .where('id', '==', id)
        .limit(1)
        .get();
      
      if (snapshot.empty) { // Verifica si el producto existe.
        throw new Error('Producto no encontrado');
      }
      
      const doc = snapshot.docs[0]; // Obtiene el documento.
      
      // Actualiza el documento usando su firestoreId (doc.id).
      await db.collection('productos').doc(doc.id).update({ 
        ...data, // Aplica los datos de actualización.
        fechaActualizacion: new Date() // Agrega una marca de tiempo de actualización.
      });
      console.log(`✅ Producto actualizado: ${id}`);
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  }

  // --- Método Estático: Eliminación Lógica (Soft Delete) ---
  // Marca el producto como inactivo en lugar de borrarlo permanentemente.
  static async delete(id) {
    try {
      // Busca el producto por 'id' para obtener la referencia de Firestore.
      const snapshot = await db.collection('productos')
        .where('id', '==', id)
        .limit(1)
        .get();
      
      if (snapshot.empty) { // Verifica la existencia.
        throw new Error('Producto no encontrado');
      }
      
      const doc = snapshot.docs[0]; // Obtiene el documento.
      
      // Realiza la eliminación lógica: actualiza 'activo' a false.
      await db.collection('productos').doc(doc.id).update({ 
        activo: false,
        fechaEliminacion: new Date() // Registra cuándo se marcó como eliminado.
      });
      console.log(`✅ Producto marcado como inactivo: ${id}`);
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  }

  // --- Método Estático: Buscar por Categoría ---
  // Recupera todos los productos activos que pertenecen a una categoría específica.
  static async findByCategoria(categoriaId) {
    try {
      const snapshot = await db.collection('productos')
        .where('categoriaId', '==', categoriaId) // Filtra por la categoría.
        .where('activo', '==', true) // Asegura que solo se devuelvan los productos activos.
        .get();
      // Mapea los resultados a objetos.
      return snapshot.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error buscando productos por categoría:', error);
      throw error;
    }
  }
}

// Exporta la clase 'Producto' para su uso en los controladores o servicios.
module.exports = Producto;