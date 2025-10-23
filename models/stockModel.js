// Importa la instancia de la base de datos de Firebase configurada.
const { db } = require('../config/firebase'); 
// Importa la utilidad para generar IDs numéricos secuenciales.
const AutoIncrement = require('../utils/autoIncrement'); 

// --- Definición de la Clase Modelo 'Stock' ---
class Stock {
  // El constructor inicializa una nueva instancia de Stock.
  constructor(data) {
    // ID del producto al que se refiere este registro de inventario.
    this.productoId = data.productoId; 
    // Cantidad actual del producto en inventario.
    this.cantidad = data.cantidad; 
    // Nivel de stock mínimo o de alerta, por defecto 5.
    this.minimo = data.minimo || 5; 
    // Ubicación física del stock, por defecto 'Depósito Principal'.
    this.ubicacion = data.ubicacion || 'Depósito Principal'; 
    // Indica si este registro de stock está activo/vigente.
    this.activo = data.activo !== undefined ? data.activo : true; 
    // Marca de tiempo de la creación del registro.
    this.fechaCreacion = new Date(); 
  }

  // --- Método de Instancia: Guardar (Crear) un Nuevo Registro de Stock ---
  // Persiste la instancia actual como un nuevo documento en Firestore.
  async save() {
    try {
      // Genera el próximo ID numérico secuencial para el campo 'id'.
      const stockId = await AutoIncrement.generateId('stocks'); 
      // Obtiene una referencia a un nuevo documento, generando un 'firestoreId'.
      const stockRef = db.collection('stocks').doc(); 
      
      // Objeto con todos los datos a persistir.
      const stockData = {
        id: stockId, // ID numérico de la aplicación.
        firestoreId: stockRef.id, // ID único de Firestore.
        productoId: this.productoId,
        cantidad: this.cantidad,
        minimo: this.minimo,
        ubicacion: this.ubicacion,
        activo: this.activo,
        fechaCreacion: this.fechaCreacion
      };
      
      await stockRef.set(stockData); // Escribe el documento en la colección 'stocks'.
      console.log(`✅ Stock creado: ${stockId} para producto: ${this.productoId}`); // Log de éxito.
      // Devuelve los datos guardados.
      return { id: stockId, ...stockData }; 
    } catch (error) {
      console.error('❌ Error creando stock:', error); // Manejo de error.
      throw error; 
    }
  }

  // --- Método Estático: Buscar Stock Activo por ID de Producto ---
  // Este es el método clave para obtener la información de stock actual.
  static async findByProductoId(productoId) {
    try {
      const snapshot = await db.collection('stocks')
        .where('productoId', '==', productoId) // Filtra por el producto.
        .where('activo', '==', true) // Filtra para obtener solo el registro de stock vigente.
        .limit(1) // Optimiza la consulta (asume que solo hay un stock activo por producto).
        .get(); 
      
      if (snapshot.empty) { // Si no encuentra un registro activo, devuelve null.
        return null;
      }
      
      const doc = snapshot.docs[0]; // Obtiene el documento.
      // Retorna los datos con el firestoreId.
      return { firestoreId: doc.id, ...doc.data() }; 
    } catch (error) {
      console.error('❌ Error buscando stock:', error);
      throw error;
    }
  }

  // --- Método Estático: Actualizar Cantidad de Stock ---
  // Realiza una operación de actualización directa sobre la cantidad del stock activo.
  static async updateCantidad(productoId, nuevaCantidad) {
    try {
      // Llama al método anterior para obtener el registro de stock activo.
      const stock = await this.findByProductoId(productoId); 
      if (!stock) { // Si el registro activo no existe, lanza un error.
        throw new Error('Stock no encontrado');
      }

      // Actualiza el documento usando su firestoreId.
      await db.collection('stocks').doc(stock.firestoreId).update({ 
        cantidad: nuevaCantidad, // Establece la nueva cantidad.
        fechaActualizacion: new Date() // Registra la marca de tiempo de la modificación.
      });
      console.log(`✅ Stock actualizado para producto: ${productoId}`);
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  }

  // --- Método Estático: Encontrar Todos los Productos con Stock Bajo ---
  static async findAllBajoStock() {
    try {
      const snapshot = await db.collection('stocks')
        .where('activo', '==', true) // Solo consulta registros de stock activos.
        .get(); 
      
      // Mapea los documentos de Firestore a objetos JavaScript.
      return snapshot.docs
        .map(doc => ({ firestoreId: doc.id, ...doc.data() })) 
        // Filtra en memoria: busca aquellos donde la cantidad es menor o igual al mínimo.
        // NOTA: Este filtro se hace en la aplicación (no en Firestore) porque la base de datos
        // no soporta consultas tipo "where cantidad <= minimo".
        .filter(stock => stock.cantidad <= stock.minimo); 
    } catch (error) {
      console.error('❌ Error obteniendo stock bajo:', error);
      throw error;
    }
  }
}

// Exporta la clase para su uso.
module.exports = Stock;