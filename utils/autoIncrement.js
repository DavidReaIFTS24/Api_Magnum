// Importa la instancia de la base de datos de Firebase, necesaria para realizar transacciones.
const { db } = require('../config/firebase'); 

// --- Definición de la Clase de Utilidad 'AutoIncrement' ---
class AutoIncrement {
  // --- Método Estático: Obtener la Siguiente Secuencia Numérica ---
  // Método crucial que usa una transacción para garantizar la atomicidad del conteo.
  static async getNextSequence(collectionName) {
    // Define la referencia al documento contador para la colección específica (ej: 'contadores/productos').
    const counterRef = db.collection('contadores').doc(collectionName); 
    
    try {
      // Inicia una transacción para asegurar que la lectura y la escritura se hagan sin interrupción.
      const result = await db.runTransaction(async (transaction) => {
        // Lee el documento contador dentro de la transacción.
        const counterDoc = await transaction.get(counterRef); 
        
        if (!counterDoc.exists) {
          // Si el contador no existe, es la primera vez que se usa para esta colección.
          // Inicializa el valor con un valor base personalizado (ej: 1000 para productos).
          const initialData = { secuencia: this.getInitialValue(collectionName) }; 
          // Escribe el valor inicial en la base de datos dentro de la transacción.
          transaction.set(counterRef, initialData); 
          return initialData.secuencia; // Devuelve el valor inicial.
        }
        
        // Si el contador existe, incrementa el valor actual en 1.
        const newSequence = counterDoc.data().secuencia + 1; 
        // Actualiza el documento contador con el nuevo valor dentro de la transacción.
        transaction.update(counterRef, { secuencia: newSequence }); 
        return newSequence; // Devuelve el nuevo número de secuencia.
      });
      
      return result; // Retorna el resultado de la transacción (el número de secuencia).
    } catch (error) {
      console.error('❌ Error en auto-increment:', error); // Manejo de errores de la transacción.
      // Fallback: si la transacción falla repetidamente, usa un timestamp como ID. (No secuencial, pero único).
      return Date.now(); 
    }
  }

  // --- Método Estático: Obtener Valor Inicial Personalizado ---
  // Define los valores de inicio para las secuencias de diferentes colecciones.
  static getInitialValue(collectionName) {
    const initialValues = {
      productos: 1000, // Los IDs de productos empezarán en PROD-1000.
      pedidos: 2000, // Los IDs de pedidos empezarán en PED-2000.
      categorias: 100, // ...
      usuarios: 10,
      precios: 5000,
      stocks: 3000
    };
    // Retorna el valor específico o 1 si la colección no está mapeada.
    return initialValues[collectionName] || 1; 
  }

  // --- Método Estático: Generar ID Final con Formato ---
  // Combina la secuencia numérica con un prefijo y relleno de ceros.
  static async generateId(collectionName) {
    // Obtiene el siguiente número de secuencia de forma segura.
    const nextId = await this.getNextSequence(collectionName); 
    
    // Objeto de mapeo para definir el formato (prefijo y longitud).
    const formats = {
      // Ejemplo: 'PROD-' + '1001' rellenado a 4 ceros = 'PROD-1001'.
      productos: `PROD-${String(nextId).padStart(4, '0')}`, 
      // Ejemplo: 'PED-' + '2001' rellenado a 5 ceros = 'PED-02001'.
      pedidos: `PED-${String(nextId).padStart(5, '0')}`, 
      categorias: `CAT-${String(nextId).padStart(3, '0')}`,
      usuarios: `USER-${String(nextId).padStart(3, '0')}`,
      precios: `PRICE-${String(nextId).padStart(4, '0')}`,
      stocks: `STOCK-${String(nextId).padStart(4, '0')}`
    };
    
    // Retorna el ID formateado o un formato genérico de fallback.
    return formats[collectionName] || `ID-${nextId}`; 
  }
}

// Exporta la clase de utilidad.
module.exports = AutoIncrement;