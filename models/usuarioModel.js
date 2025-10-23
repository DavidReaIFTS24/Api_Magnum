// Importa la instancia de la base de datos de Firebase configurada.
const { db } = require('../config/firebase'); 
// Importa la librería bcryptjs para hashear y comparar contraseñas de forma segura.
const bcrypt = require('bcryptjs'); 
// Importa la utilidad para generar IDs numéricos secuenciales personalizados (necesario en Firestore).
const AutoIncrement = require('../utils/autoIncrement'); 

// --- Definición de la Clase Modelo 'Usuario' ---
class Usuario {
    // El constructor inicializa una nueva instancia de Usuario.
    constructor(data) {
        this.email = data.email; 
        this.password = data.password; // La contraseña se guarda aquí temporalmente, antes de ser hasheada.
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        // Asigna el rol, por defecto 'empleado'.
        this.rol = data.rol || 'empleado'; 
        // Usa 'activo' para la eliminación lógica, por defecto es true.
        this.activo = data.activo !== undefined ? data.activo : true; 
        // Marca de tiempo del registro.
        this.fechaCreacion = new Date(); 
    }

    // --- Métodos de Seguridad ---
    // Hashea la contraseña de la instancia actual de forma asíncrona.
    async hashPassword() {
        // Usa bcrypt para hashear la contraseña con un costo de 10.
        this.password = await bcrypt.hash(this.password, 10); 
    }

    // Compara una contraseña plana con el hash almacenado en la instancia.
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password); // Devuelve true o false.
    }

    // --- Método de Instancia: Guardar (Crear) un Nuevo Documento ---
    async save() {
        try {
            await this.hashPassword(); // Llama a hashear la contraseña antes de guardar.
            
            // 1. Genera el ID numérico personalizado para el usuario.
            const userId = await AutoIncrement.generateId('usuarios'); 
            // 2. Obtiene una referencia a un nuevo documento, generando el ID de Firestore.
            const usuarioRef = db.collection('usuarios').doc(); 
            
            // 3. Prepara los datos a guardar.
            const usuarioData = {
                id: userId, // ID autoincremental personalizado.
                firestoreId: usuarioRef.id, // ID original de Firestore.
                email: this.email,
                password: this.password, // Guarda la contraseña ya hasheada.
                nombre: this.nombre,
                apellido: this.apellido,
                rol: this.rol,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            await usuarioRef.set(usuarioData); // Guarda el documento.
            console.log(`✅ Usuario creado: ${userId} - ${this.email}`); // Log de éxito.
            
            return { id: userId, ...usuarioData }; // Devuelve el usuario creado.
            
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            throw error;
        }
    }

    // --- Método Estático: Buscar por Email (Usado para Login) ---
    static async findByEmail(email) {
        try {
            // Consulta para buscar un usuario por su campo 'email'.
            const snapshot = await db.collection('usuarios')
                .where('email', '==', email) // Filtra por email (asumido como único).
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return null; // No encontrado.
            }
            
            const doc = snapshot.docs[0];
            return { 
                firestoreId: doc.id,  // Devuelve el ID de Firestore.
                ...doc.data()         // Devuelve todos los datos, incluido el ID personalizado y el hash.
            };
            
        } catch (error) {
            console.error('❌ Error buscando usuario:', error);
            throw error;
        }
    }

    // --- Método Estático: Buscar por ID Personalizado ---
    static async findById(id) {
        try {
            console.log(`🔍 Buscando usuario por ID personalizado: ${id}`); // Log de depuración.
            
            // Consulta que busca por el campo 'id' autoincremental.
            const snapshot = await db.collection('usuarios')
                .where('id', '==', id)  // Usa el ID de la aplicación, no el de Firestore.
                .limit(1)
                .get();
            
            console.log(`📊 Resultados encontrados: ${snapshot.size}`); // Log de depuración.
            
            if (snapshot.empty) {
                console.log(`❌ Usuario no encontrado con ID: ${id}`);
                return null;
            }
            
            const doc = snapshot.docs[0];
            console.log(`✅ Usuario encontrado: ${doc.data().email}`);
            
            return { 
                firestoreId: doc.id,  // Devuelve el ID de Firestore.
                ...doc.data()         // Devuelve todos los datos.
            };
            
        } catch (error) {
            console.error('❌ Error buscando usuario por ID:', error);
            throw error;
        }
    }

    // --- Método Estático: Obtener Todos los Usuarios ---
    static async findAll() {
        try {
            const snapshot = await db.collection('usuarios').get(); // Trae toda la colección.
            // Mapea los resultados.
            return snapshot.docs.map(doc => ({ 
                firestoreId: doc.id,  // ID de Firestore.
                ...doc.data()         // Todos los datos.
            }));
            
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            throw error;
        }
    }

    // --- Método Estático: Actualizar un Usuario ---
    static async update(id, data) {
        try {
            // 1. Busca el documento por ID personalizado para obtener el firestoreId.
            const snapshot = await db.collection('usuarios')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                throw new Error('Usuario no encontrado');
            }
            
            const doc = snapshot.docs[0];
            
            // Prevención de seguridad: No se permite actualizar la contraseña aquí.
            if (data.password) { 
                delete data.password; // Si se intenta pasar, se elimina del objeto de actualización.
            }
            
            // 2. Actualiza el documento usando el ID de Firestore.
            await db.collection('usuarios').doc(doc.id).update({
                ...data, // Aplica los cambios restantes.
                fechaActualizacion: new Date() // Marca de tiempo de la actualización.
            });
            
            console.log(`✅ Usuario actualizado: ${id}`);
            
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);
            throw error;
        }
    }

    // --- Método Estático: Eliminación Lógica (Soft Delete) ---
    static async delete(id) {
        try {
            // 1. Busca el documento por ID personalizado.
            const snapshot = await db.collection('usuarios')
                .where('id', '==', id)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                throw new Error('Usuario no encontrado');
            }
            
            const doc = snapshot.docs[0];
            
            // 2. Realiza la eliminación lógica.
            await db.collection('usuarios').doc(doc.id).update({
                activo: false, // Marca el usuario como inactivo.
                fechaEliminacion: new Date()
            });
            
            console.log(`✅ Usuario marcado como inactivo: ${id}`);
            
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            throw error;
        }
    }
}

// Exporta la clase para su uso.
module.exports = Usuario;