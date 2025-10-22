const { db } = require('../config/firebase'); // Importa la instancia de Firestore
const bcrypt = require('bcryptjs'); // Importa la librería para el hashing de contraseñas

/**
 * Clase Modelo para gestionar los Usuarios y su Autenticación.
 * Esta clase se encarga del hashing de contraseñas y la interacción con la colección 'usuarios' en Firestore.
 */
class Usuario {
    /**
     * Constructor para crear una nueva instancia de Usuario.
     * @param {object} data - Objeto con los datos iniciales del usuario.
     */
    constructor(data) {
        // 1. Datos de autenticación
        this.email = data.email;
        this.password = data.password; // La contraseña se hasheará antes de guardarse
        
        // 2. Datos personales y roles
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.rol = data.rol || 'empleado'; // Rol por defecto: 'empleado'
        
        // 3. Control de estado (Soft Delete)
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // 4. Marca de tiempo de creación
        this.fechaCreacion = new Date();
    }

    // -------------------------------------------------------------------------
    // Métodos de Seguridad y Autenticación
    // -------------------------------------------------------------------------

    /**
     * Hashea la contraseña de la instancia usando bcryptjs.
     */
    async hashPassword() {
        // Genera un salt y hashea la contraseña, reemplazando el valor en la instancia
        this.password = await bcrypt.hash(this.password, 10);
    }

    /**
     * Compara una contraseña plana con la contraseña hasheada almacenada en la instancia.
     * @param {string} password - La contraseña plana ingresada por el usuario.
     * @returns {Promise<boolean>} True si coinciden, false en caso contrario.
     */
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // -------------------------------------------------------------------------
    // Métodos de Instancia (Operación de Escritura)
    // -------------------------------------------------------------------------

    /**
     * Hashea la contraseña y guarda la nueva instancia de Usuario en Firestore.
     * @returns {object} El objeto del usuario guardado, incluyendo el ID.
     */
    async save() {
        try {
            // 1. Hashear la contraseña antes de guardarla
            await this.hashPassword(); 
            
            // 2. Crear una referencia de documento y obtener el ID
            const usuarioRef = db.collection('usuarios').doc();
            
            // 3. Preparar el objeto de datos a guardar
            const usuarioData = {
                id: usuarioRef.id, // Almacenar el ID como un campo
                email: this.email,
                password: this.password, // Contraseña hasheada
                nombre: this.nombre,
                apellido: this.apellido,
                rol: this.rol,
                activo: this.activo,
                fechaCreacion: this.fechaCreacion
            };
            
            // 4. Escribir los datos en Firestore
            await usuarioRef.set(usuarioData);
            
            console.log(`✅ Usuario creado: ${this.email}`);
            
            // 5. Devolver el usuario creado
            return { id: usuarioRef.id, ...usuarioData };
            
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Métodos Estáticos (Operaciones de Lectura y Modificación)
    // -------------------------------------------------------------------------

    /**
     * Busca y recupera un usuario por su dirección de email. (Usado para login)
     * @param {string} email - El email del usuario.
     * @returns {object|null} El objeto del usuario encontrado (incluyendo password) o null.
     */
    static async findByEmail(email) {
        try {
            // 1. Consultar la base de datos buscando el email
            const snapshot = await db.collection('usuarios')
                .where('email', '==', email)
                .limit(1) // Asumimos que el email es único
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            // 2. Devolver los datos del documento
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando usuario:', error);
            throw error;
        }
    }

    /**
     * Busca y recupera un usuario por su ID de documento.
     * @param {string} id - ID del documento del usuario.
     * @returns {object|null} El objeto del usuario encontrado o null.
     */
    static async findById(id) {
        try {
            const doc = await db.collection('usuarios').doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
            
        } catch (error) {
            console.error('❌ Error buscando usuario por ID:', error);
            throw error;
        }
    }

    /**
     * Recupera todos los usuarios de la base de datos.
     * @returns {Array<object>} Una lista de todos los objetos de usuario.
     */
    static async findAll() {
        try {
            const snapshot = await db.collection('usuarios').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            throw error;
        }
    }

    /**
     * Actualiza uno o más campos de un usuario específico.
     * @param {string} id - ID del documento a actualizar.
     * @param {object} data - Objeto con los campos y valores a modificar.
     */
    static async update(id, data) {
        try {
            // 1. **Mecanismo de Seguridad:** Prevenir que se actualice la contraseña
            // mediante la función de actualización de datos generales (debe usarse cambiarPassword).
            if (data.password) {
                delete data.password;
            }
            
            // 2. Actualizar el documento en Firestore
            await db.collection('usuarios').doc(id).update({
                ...data, // Esparcir los campos recibidos (ej: nombre, apellido, rol, activo)
                fechaActualizacion: new Date()
            });
            
            console.log(`✅ Usuario actualizado: ${id}`);
            
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);
            throw error;
        }
    }

    /**
     * Realiza una eliminación suave (soft delete) marcando el usuario como inactivo.
     * @param {string} id - ID del documento a eliminar suavemente.
     */
    static async delete(id) {
        try {
            // 1. Actualizar el campo 'activo' a false y registrar la fecha de eliminación
            await db.collection('usuarios').doc(id).update({
                activo: false,
                fechaEliminacion: new Date()
            });
            
            console.log(`✅ Usuario marcado como inactivo: ${id}`);
            
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            throw error;
        }
    }
}

module.exports = Usuario; // Exportar la clase modelo