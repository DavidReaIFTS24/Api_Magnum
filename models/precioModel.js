// Importa la instancia de la base de datos de Firebase, esencial para cualquier operación de DB.
const { db } = require('../config/firebase'); 
// Importa la utilidad personalizada para generar IDs numéricos secuenciales.
const AutoIncrement = require('../utils/autoIncrement');

// --- Definición de la Clase Modelo 'Precio' ---
class Precio {
  // El constructor se llama al crear una nueva instancia de Precio.
  constructor(data) {
    // Almacena el ID del producto al que pertenece este precio (relación uno a muchos: producto 1 -> N precios).
    this.productoId = data.productoId; 
    // El precio estándar del producto.
    this.precio = data.precio; 
    // Precio especial o de promoción; si no se provee, se establece como null.
    this.precioOferta = data.precioOferta || null; 
    // Moneda utilizada, por defecto 'ARS' (Peso Argentino).
    this.moneda = data.moneda || 'ARS'; 
    // Booleano para indicar si este es el precio actual (vigente). Si no se define, es true.
    this.activo = data.activo !== undefined ? data.activo : true; 
    // Registra el momento exacto en que se crea este registro de precio.
    this.fechaCreacion = new Date(); 
  }

  // --- Método de Instancia: Guardar (Crear) un Nuevo Registro de Precio ---
  // Este método maneja la lógica clave del historial: desactiva el precio antiguo antes de guardar el nuevo.
  async save() {
    try {
      // Comentario: Desactiva el registro de precio anterior para mantener el historial.
      await db.collection('precios') // Accede a la colección 'precios'.
        .where('productoId', '==', this.productoId) // Filtra para encontrar solo los precios de este producto.
        .where('activo', '==', true) // Filtra para encontrar el único precio activo (el actual).
        .get() // Ejecuta la consulta para obtener el documento.
        .then(snapshot => { // Maneja los resultados de la consulta.
          const batch = db.batch(); // Inicia un batch para ejecutar múltiples escrituras atómicamente.
          snapshot.docs.forEach(doc => { // Itera sobre los documentos encontrados (debería ser solo 1).
            batch.update(doc.ref, { activo: false }); // Prepara la actualización para marcarlo como inactivo.
          });
          return batch.commit(); // Ejecuta las operaciones del batch.
        });

      // Genera el ID numérico autoincrementable para el campo 'id'.
      const priceId = await AutoIncrement.generateId('precios'); 
      // Obtiene una referencia a un nuevo documento en Firestore, generando un 'firestoreId'.
      const precioRef = db.collection('precios').doc(); 
      
      // Objeto que contiene todos los datos a guardar en Firestore.
      const precioData = {
        id: priceId, // ID numérico de la aplicación.
        firestoreId: precioRef.id, // ID único de Firestore.
        productoId: this.productoId,
        precio: this.precio,
        precioOferta: this.precioOferta,
        moneda: this.moneda,
        activo: this.activo, // Este nuevo registro se guarda como activo: true.
        fechaCreacion: this.fechaCreacion
      };
      
      await precioRef.set(precioData); // Guarda el nuevo documento en Firestore.
      // Mensaje de éxito en la consola.
      console.log(`✅ Precio creado: ${priceId} para producto: ${this.productoId}`); 
      // Devuelve los datos completos del nuevo registro.
      return { id: priceId, ...precioData }; 
    } catch (error) {
      console.error('❌ Error creando precio:', error); // Manejo de error.
      throw error; // Lanza el error para ser manejado por el llamador.
    }
  }

  // --- Método Estático: Buscar Precio Actual de un Producto ---
  static async findByProductoId(productoId) {
    try {
      const snapshot = await db.collection('precios') // Accede a la colección.
        .where('productoId', '==', productoId) // Filtra por el producto.
        .where('activo', '==', true) // Filtra SOLAMENTE por el registro activo (el vigente).
        .limit(1) // Optimiza la consulta limitando a un solo resultado.
        .get();
      
      if (snapshot.empty) { // Si no hay documentos activos, devuelve null.
        return null;
      }
      
      const doc = snapshot.docs[0]; // Obtiene el único documento encontrado.
      // Retorna los datos incluyendo el ID de Firestore.
      return { firestoreId: doc.id, ...doc.data() }; 
    } catch (error) {
      console.error('❌ Error buscando precio:', error);
      throw error;
    }
  }

  // --- Método Estático: Obtener Historial de Precios ---
  static async findHistorialByProductoId(productoId) {
    try {
      const snapshot = await db.collection('precios')
        .where('productoId', '==', productoId) // Filtra por producto, sin importar si está activo o no.
        .orderBy('fechaCreacion', 'desc') // Ordena del más nuevo al más antiguo (útil para auditoría).
        .get();
      
      // Mapea los documentos de Firestore a objetos JavaScript.
      return snapshot.docs.map(doc => ({ 
        firestoreId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error obteniendo historial de precios:', error);
      throw error;
    }
  }
}

// Exporta la clase para que pueda ser utilizada como un modelo de datos en la aplicación.
module.exports = Precio;