const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log('🚀 Inicializando base de datos Magnum...');
  
  try {
    // 1. Crear usuarios iniciales
    await createInitialUsers();
    
    // 2. Crear categorías
    const categorias = await createInitialCategories();
    
    // 3. Crear productos
    await createInitialProducts(categorias);
    
    console.log('✅ Base de datos inicializada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

async function createInitialUsers() {
  console.log('👥 Creando usuarios iniciales...');
  
  const usuarios = [
    {
      email: "admin@magnum.com",
      password: await bcrypt.hash("admin123", 10),
      nombre: "Carlos",
      apellido: "Magnum",
      rol: "admin",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      email: "empleado@magnum.com",
      password: await bcrypt.hash("empleado123", 10),
      nombre: "Ana",
      apellido: "Garcia",
      rol: "empleado",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      email: "ventas@magnum.com",
      password: await bcrypt.hash("ventas123", 10),
      nombre: "Luis",
      apellido: "Martinez",
      rol: "empleado",
      activo: true,
      fechaCreacion: new Date()
    }
  ];

  for (const usuario of usuarios) {
    const userRef = db.collection('usuarios').doc();
    await userRef.set({
      id: userRef.id,
      ...usuario
    });
    console.log(`✅ Usuario creado: ${usuario.email}`);
  }
}

async function createInitialCategories() {
  console.log('📂 Creando categorías...');
  
  const categorias = [
    {
      nombre: "Carteras",
      descripcion: "Carteras de cuero genuino para mujer",
      imagen: "https://ejemplo.com/carteras.jpg",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      nombre: "Mochilas",
      descripcion: "Mochilas elegantes y funcionales de cuero",
      imagen: "https://ejemplo.com/mochilas.jpg",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      nombre: "Billeteras",
      descripcion: "Billeteras de cuero para hombre y mujer",
      imagen: "https://ejemplo.com/billeteras.jpg",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      nombre: "Riñoneras",
      descripcion: "Riñoneras modernas y prácticas",
      imagen: "https://ejemplo.com/rinoneras.jpg",
      activo: true,
      fechaCreacion: new Date()
    },
    {
      nombre: "Accesorios",
      descripcion: "Cinturones, llaveros y más accesorios de cuero",
      imagen: "https://ejemplo.com/accesorios.jpg",
      activo: true,
      fechaCreacion: new Date()
    }
  ];

  const categoriasCreadas = [];
  for (const categoria of categorias) {
    const catRef = db.collection('categorias').doc();
    const categoriaData = {
      id: catRef.id,
      ...categoria
    };
    await catRef.set(categoriaData);
    categoriasCreadas.push(categoriaData);
    console.log(`✅ Categoría creada: ${categoria.nombre}`);
  }

  return categoriasCreadas;
}

async function createInitialProducts(categorias) {
  console.log('🛍️ Creando productos...');
  
  // Encontrar IDs de categorías
  const carterasId = categorias.find(c => c.nombre === "Carteras").id;
  const mochilasId = categorias.find(c => c.nombre === "Mochilas").id;
  const billeterasId = categorias.find(c => c.nombre === "Billeteras").id;
  const rinonerasId = categorias.find(c => c.nombre === "Riñoneras").id;
  const accesoriosId = categorias.find(c => c.nombre === "Accesorios").id;

  const productos = [
    // CARTERAS
    {
      nombre: "Cartera Elegance Cuero Negro",
      descripcion: "Cartera de cuero genuino negro con detalles en dorado, múltiples compartimentos",
      categoriaId: carterasId,
      material: "Cuero genuino",
      color: "Negro",
      dimensiones: "25x18x10 cm",
      imagen: "https://ejemplo.com/cartera-negra.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 25900,
      stock: 15
    },
    {
      nombre: "Cartera Vintage Marrón",
      descripcion: "Cartera estilo vintage en cuero marrón envejecido, cierre metálico",
      categoriaId: carterasId,
      material: "Cuero vacuno",
      color: "Marrón",
      dimensiones: "28x20x12 cm",
      imagen: "https://ejemplo.com/cartera-marron.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 28900,
      stock: 8
    },
    {
      nombre: "Cartera Minimalista Beige",
      descripcion: "Cartera minimalista en cuero beige, diseño moderno y liviano",
      categoriaId: carterasId,
      material: "Cuero sintético premium",
      color: "Beige",
      dimensiones: "22x15x5 cm",
      imagen: "https://ejemplo.com/cartera-beige.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 18900,
      stock: 20
    },

    // MOCHILAS
    {
      nombre: "Mochila Executive Cuero Negro",
      descripcion: "Mochila ejecutiva en cuero negro, ideal para laptop hasta 15 pulgadas",
      categoriaId: mochilasId,
      material: "Cuero genuino",
      color: "Negro",
      dimensiones: "40x30x15 cm",
      imagen: "https://ejemplo.com/mochila-ejecutiva.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 45900,
      stock: 12
    },
    {
      nombre: "Mochila Urbana Cuero Marrón",
      descripcion: "Mochila urbana en cuero marrón, estilo casual y resistente",
      categoriaId: mochilasId,
      material: "Cuero vacuno",
      color: "Marrón",
      dimensiones: "35x25x12 cm",
      imagen: "https://ejemplo.com/mochila-urbana.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 38900,
      stock: 10
    },

    // BILLETERAS
    {
      nombre: "Billetera Clásica Cuero Negro",
      descripcion: "Billetera clásica en cuero negro con múltiples ranuras para tarjetas",
      categoriaId: billeterasId,
      material: "Cuero genuino",
      color: "Negro",
      dimensiones: "11x8x2 cm",
      imagen: "https://ejemplo.com/billetera-negra.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 8900,
      stock: 25
    },
    {
      nombre: "Billetera RFID Marrón",
      descripcion: "Billetera con protección RFID, cuero marrón, diseño delgado",
      categoriaId: billeterasId,
      material: "Cuero con protección RFID",
      color: "Marrón",
      dimensiones: "10x7x1 cm",
      imagen: "https://ejemplo.com/billetera-rfid.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 12900,
      stock: 18
    },

    // RIÑONERAS
    {
      nombre: "Riñonera Deportiva Negra",
      descripcion: "Riñonera deportiva en cuero negro, ajustable, múltiples bolsillos",
      categoriaId: rinonerasId,
      material: "Cuero sintético resistente",
      color: "Negro",
      dimensiones: "30x15x8 cm",
      imagen: "https://ejemplo.com/rinonera-deportiva.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 14900,
      stock: 22
    },

    // ACCESORIOS
    {
      nombre: "Cinturón Clásico Cuero Negro",
      descripcion: "Cinturón clásico en cuero negro, hebilla plateada, talla ajustable",
      categoriaId: accesoriosId,
      material: "Cuero genuino",
      color: "Negro",
      dimensiones: "110x3.5 cm",
      imagen: "https://ejemplo.com/cinturon-negro.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 7900,
      stock: 30
    },
    {
      nombre: "Llavero Magnum Cuero",
      descripcion: "Llavero personalizado Magnum en cuero con detalles metálicos",
      categoriaId: accesoriosId,
      material: "Cuero y metal",
      color: "Marrón",
      dimensiones: "8x4 cm",
      imagen: "https://ejemplo.com/llavero-magnum.jpg",
      activo: true,
      fechaCreacion: new Date(),
      precio: 2900,
      stock: 50
    }
  ];

  for (const producto of productos) {
    // Crear producto
    const productoRef = db.collection('productos').doc();
    const productoData = {
      id: productoRef.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
      material: producto.material,
      color: producto.color,
      dimensiones: producto.dimensiones,
      imagen: producto.imagen,
      activo: producto.activo,
      fechaCreacion: producto.fechaCreacion
    };
    await productoRef.set(productoData);

    // Crear precio
    const precioRef = db.collection('precios').doc();
    await precioRef.set({
      id: precioRef.id,
      productoId: productoRef.id,
      precio: producto.precio,
      precioOferta: null,
      moneda: "ARS",
      activo: true,
      fechaCreacion: new Date()
    });

    // Crear stock
    const stockRef = db.collection('stocks').doc();
    await stockRef.set({
      id: stockRef.id,
      productoId: productoRef.id,
      cantidad: producto.stock,
      minimo: 5,
      ubicacion: "Depósito Principal",
      activo: true,
      fechaCreacion: new Date()
    });

    console.log(`✅ Producto creado: ${producto.nombre}`);
  }
}

// Ejecutar el script
initDatabase();