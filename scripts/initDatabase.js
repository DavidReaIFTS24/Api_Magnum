const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log('🚀 Inicializando base de datos Magnum con IDs autoincrementales...');
  
  try {
    // 0. Crear o resetear contadores
    await createOrResetCounters();
    
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

async function createOrResetCounters() {
  console.log('🔢 Configurando contadores...');
  
  const counters = [
    { id: 'usuarios', secuencia: 100 },
    { id: 'productos', secuencia: 1000 },
    { id: 'categorias', secuencia: 10 },
    { id: 'precios', secuencia: 5000 },
    { id: 'stocks', secuencia: 2000 },
    { id: 'pedidos', secuencia: 3000 }
  ];

  for (const counter of counters) {
    await db.collection('contadores').doc(counter.id).set(counter);
    console.log(`✅ Contador: ${counter.id} = ${counter.secuencia}`);
  }
}

async function getNextId(collectionName) {
  const counterRef = db.collection('contadores').doc(collectionName);
  
  const result = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    if (!counterDoc.exists) {
      throw new Error(`Contador ${collectionName} no encontrado`);
    }
    
    const newSequence = counterDoc.data().secuencia + 1;
    transaction.update(counterRef, { secuencia: newSequence });
    
    return newSequence;
  });
  
  return result;
}

function formatId(collectionName, sequence) {
  const formats = {
    usuarios: `USER-${String(sequence).padStart(3, '0')}`,
    productos: `PROD-${String(sequence).padStart(4, '0')}`,
    categorias: `CAT-${String(sequence).padStart(3, '0')}`,
    precios: `PRICE-${String(sequence).padStart(4, '0')}`,
    stocks: `STOCK-${String(sequence).padStart(4, '0')}`,
    pedidos: `PED-${String(sequence).padStart(5, '0')}`
  };
  
  return formats[collectionName] || `ID-${sequence}`;
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
    const userId = await getNextId('usuarios');
    const formattedId = formatId('usuarios', userId);
    
    const userRef = db.collection('usuarios').doc();
    await userRef.set({
      id: formattedId, // ← ID autoincremental personalizado
      firestoreId: userRef.id, // ← ID original de Firestore
      ...usuario
    });
    console.log(`✅ Usuario creado: ${formattedId} - ${usuario.email}`);
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
    const categoryId = await getNextId('categorias');
    const formattedId = formatId('categorias', categoryId);
    
    const catRef = db.collection('categorias').doc();
    const categoriaData = {
      id: formattedId, // ← ID autoincremental personalizado
      firestoreId: catRef.id, // ← ID original de Firestore
      ...categoria
    };
    await catRef.set(categoriaData);
    categoriasCreadas.push(categoriaData);
    console.log(`✅ Categoría creada: ${formattedId} - ${categoria.nombre}`);
  }

  return categoriasCreadas;
}

async function createInitialProducts(categorias) {
  console.log('🛍️ Creando productos...');
  
  // Encontrar IDs de categorías (ahora son los IDs autoincrementales)
  const carterasCat = categorias.find(c => c.nombre === "Carteras");
  const mochilasCat = categorias.find(c => c.nombre === "Mochilas");
  const billeterasCat = categorias.find(c => c.nombre === "Billeteras");
  const rinonerasCat = categorias.find(c => c.nombre === "Riñoneras");
  const accesoriosCat = categorias.find(c => c.nombre === "Accesorios");

  const productos = [
    // CARTERAS
    {
      nombre: "Cartera Elegance Cuero Negro",
      descripcion: "Cartera de cuero genuino negro con detalles en dorado, múltiples compartimentos",
      categoriaId: carterasCat.id, // ← Usar el ID autoincremental de la categoría
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
      categoriaId: carterasCat.id,
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
      categoriaId: carterasCat.id,
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
      categoriaId: mochilasCat.id,
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
      categoriaId: mochilasCat.id,
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
      categoriaId: billeterasCat.id,
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
      categoriaId: billeterasCat.id,
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
      categoriaId: rinonerasCat.id,
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
      categoriaId: accesoriosCat.id,
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
      categoriaId: accesoriosCat.id,
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
    // Obtener ID autoincremental para producto
    const productId = await getNextId('productos');
    const formattedProductId = formatId('productos', productId);
    
    // Crear producto
    const productoRef = db.collection('productos').doc();
    const productoData = {
      id: formattedProductId, // ← ID autoincremental personalizado
      firestoreId: productoRef.id, // ← ID original de Firestore
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

    // Obtener ID autoincremental para precio
    const priceId = await getNextId('precios');
    const formattedPriceId = formatId('precios', priceId);
    
    // Crear precio
    const precioRef = db.collection('precios').doc();
    await precioRef.set({
      id: formattedPriceId, // ← ID autoincremental personalizado
      firestoreId: precioRef.id, // ← ID original de Firestore
      productoId: formattedProductId, // ← Relacionar con ID del producto
      precio: producto.precio,
      precioOferta: null,
      moneda: "ARS",
      activo: true,
      fechaCreacion: new Date()
    });

    // Obtener ID autoincremental para stock
    const stockId = await getNextId('stocks');
    const formattedStockId = formatId('stocks', stockId);
    
    // Crear stock
    const stockRef = db.collection('stocks').doc();
    await stockRef.set({
      id: formattedStockId, // ← ID autoincremental personalizado
      firestoreId: stockRef.id, // ← ID original de Firestore
      productoId: formattedProductId, // ← Relacionar con ID del producto
      cantidad: producto.stock,
      minimo: 5,
      ubicacion: "Depósito Principal",
      activo: true,
      fechaCreacion: new Date()
    });

    console.log(`✅ Producto creado: ${formattedProductId} - ${producto.nombre}`);
  }
}

// Ejecutar el script
initDatabase();