// Importa la instancia de la base de datos de Firebase.
const { db } = require('../config/firebase');

// Importa la utilidad para generar IDs numéricos secuenciales.
// (Necesario porque Firestore no tiene autoincremento nativo).
const AutoIncrement = require('../utils/autoIncrement');

// --- Definición de la Clase Modelo 'Pedido' ---
class Pedido {
    // El constructor inicializa una nueva instancia de Pedido con los datos proporcionados.
    constructor(data) {
        // Asigna las propiedades básicas del cliente y la orden.
        this.cliente = data.cliente;
        this.email = data.email;
        this.telefono = data.telefono;
        this.direccion = data.direccion;
        this.productos = data.productos; // Asume que es un array de objetos (productos, cantidad, precio).
        this.total = data.total;
        
        // Asigna el estado. Si no se provee, el valor por defecto es 'pendiente'.
        this.estado = data.estado || 'pendiente';
        
        // Propiedad para vincular el pedido a un usuario/vendedor específico.
        this.vendedorId = data.vendedorId;
        
        // Observaciones con valor por defecto vacío.
        this.observaciones = data.observaciones || '';
        
        // Registra la marca de tiempo de la creación del objeto.
        this.fechaCreacion = new Date();
    }

    // --- Método de Instancia: Guardar (Crear) un Nuevo Pedido ---
    // Guarda el objeto actual como un documento en la colección 'pedidos' de Firestore.
    async save() {
        try {
            // 1. Generar ID Autoincrementable:
            // Obtiene el siguiente ID secuencial para el campo 'id' numérico del documento.
            const pedidoId = await AutoIncrement.generateId('pedidos');
            
            // 2. Obtener Referencia del Documento:
            // Crea una referencia con un ID de Firestore único (firestoreId).
            const pedidoRef = db.collection('pedidos').doc();
            
            // 3. Generar el Número de Pedido Único de Negocio:
            // Llama a un método interno para generar el número de pedido con formato (e.g., PED-202510-0001).
            const numeroPedido = await this.generarNumeroPedido();

            // 4. Preparar los Datos a Guardar:
            const pedidoData = {
                id: pedidoId, // El ID numérico secuencial.
                firestoreId: pedidoRef.id, // El ID de documento de Firestore.
                numero: numeroPedido, // El número de pedido con formato especial.
                // ... el resto de las propiedades del objeto Pedido
                cliente: this.cliente,
                email: this.email,
                //... (resto de campos)
                productos: this.productos,
                total: this.total,
                estado: this.estado,
                vendedorId: this.vendedorId,
                observaciones: this.observaciones,
                fechaCreacion: this.fechaCreacion
            };
            
            // 5. Escribir en Firestore:
            await pedidoRef.set(pedidoData);
            
            // 6. Retroalimentación y Retorno:
            console.log(`✅ Pedido creado: ${pedidoId} - ${pedidoData.numero}`);
            return { id: pedidoId, ...pedidoData };
            
        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            throw error;
        }
    }

    // --- Método de Instancia Privado/Auxiliar: Generar Número de Pedido ---
    // Genera un número de pedido con un formato basado en la fecha y un consecutivo mensual.
    async generarNumeroPedido() {
        const today = new Date();
        const year = today.getFullYear();
        // Obtiene el mes y le añade un '0' al principio si es necesario (ej: 01, 10).
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        // Determina el inicio del mes actual para la consulta.
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // 1. Contar Pedidos del Mes:
        // Consulta todos los pedidos creados a partir del primer día del mes actual.
        // NOTA: Para que esto funcione, 'fechaCreacion' debe estar indexado en Firestore.
        const snapshot = await db.collection('pedidos')
            .where('fechaCreacion', '>=', firstDay)
            .get();
        
        // El consecutivo será el número de documentos encontrados + 1.
        const consecutivo = snapshot.size + 1;
        
        // 2. Formatear y Retornar:
        // Crea el formato 'PED-AAAA-MM-NNNN' (ej: PED-202510-0001).
        return `PED-${year}${month}-${String(consecutivo).padStart(4, '0')}`;
    }

    // --- Método Estático: Buscar por ID Autoincrementable ---
    // Busca un pedido utilizando el campo 'id' numérico.
    static async findById(id) {
        try {
            const snapshot = await db.collection('pedidos')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            // Retorna los datos junto con el ID de Firestore ('firestoreId').
            return { firestoreId: doc.id, ...doc.data() };
        } catch (error) {
            console.error('❌ Error buscando pedido:', error);
            throw error;
        }
    }

    // --- Método Estático: Obtener Todos los Pedidos ---
    // Recupera todos los pedidos, ordenados por la fecha de creación descendente.
    static async findAll() {
        try {
            const snapshot = await db.collection('pedidos')
                .orderBy('fechaCreacion', 'desc')
                .get();
            // Mapea los documentos a un array de objetos.
            return snapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            throw error;
        }
    }

    // --- Método Estático: Obtener Pedidos por Vendedor ---
    // Filtra y ordena los pedidos por un 'vendedorId' específico.
    // NOTA: Esta consulta requerirá un índice compuesto en Firestore si se usa `where` y `orderBy` en diferentes campos.
    static async findByVendedor(vendedorId) {
        try {
            const snapshot = await db.collection('pedidos')
                .where('vendedorId', '==', vendedorId)
                .orderBy('fechaCreacion', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos por vendedor:', error);
            throw error;
        }
    }

    // --- Método Estático: Actualizar Estado del Pedido ---
    // Actualiza únicamente el campo 'estado' de un pedido.
    static async updateEstado(id, nuevoEstado) {
        try {
            // 1. Buscar el documento por el 'id' numérico para obtener el 'firestoreId'.
            const snapshot = await db.collection('pedidos')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                throw new Error('Pedido no encontrado');
            }
            
            const doc = snapshot.docs[0];
            
            // 2. Aplicar la actualización:
            // Usa el 'firestoreId' (doc.id) para la operación 'update'.
            await db.collection('pedidos').doc(doc.id).update({
                estado: nuevoEstado,
                fechaActualizacion: new Date() // Registra la fecha de modificación.
            });
            console.log(`✅ Estado de pedido actualizado: ${id} -> ${nuevoEstado}`);
        } catch (error) {
            console.error('❌ Error actualizando estado de pedido:', error);
            throw error;
        }
    }

    // --- Método Estático: Obtener Pedidos por Estado ---
    // Filtra y ordena los pedidos por su 'estado' actual.
    static async findByEstado(estado) {
        try {
            const snapshot = await db.collection('pedidos')
                .where('estado', '==', estado)
                .orderBy('fechaCreacion', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Error obteniendo pedidos por estado:', error);
            throw error;
        }
    }
}

// Exporta la clase para su uso.
module.exports = Pedido;