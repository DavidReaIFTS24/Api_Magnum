// scripts/create-counters.js
const { db } = require('../config/firebase');

async function createCounters() {
  console.log('🔢 Creando contadores para IDs autoincrementales...');
  
  const counters = [
    { id: 'usuarios', secuencia: 100 },
    { id: 'productos', secuencia: 1000 },
    { id: 'categorias', secuencia: 10 },
    { id: 'precios', secuencia: 5000 },
    { id: 'stocks', secuencia: 2000 },
    { id: 'pedidos', secuencia: 3000 }
  ];

  try {
    for (const counter of counters) {
      await db.collection('contadores').doc(counter.id).set(counter);
      console.log(`✅ Contador creado: ${counter.id} = ${counter.secuencia}`);
    }
    
    console.log('\n🎯 Todos los contadores creados exitosamente!');
    console.log('📋 Los IDs generados serán:');
    console.log('   👥 Usuarios: USER-100, USER-101, USER-102...');
    console.log('   🛍️ Productos: PROD-1000, PROD-1001, PROD-1002...');
    console.log('   📂 Categorías: CAT-010, CAT-011, CAT-012...');
    console.log('   💰 Precios: PRICE-5000, PRICE-5001, PRICE-5002...');
    console.log('   📦 Stocks: STOCK-2000, STOCK-2001, STOCK-2002...');
    console.log('   📋 Pedidos: PED-03000, PED-03001, PED-03002...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando contadores:', error);
    process.exit(1);
  }
}

// Verificar si ya existen contadores antes de crear
async function checkExistingCounters() {
  try {
    const snapshot = await db.collection('contadores').limit(1).get();
    
    if (snapshot.empty) {
      console.log('📝 No existen contadores. Creando nuevos...');
      return true; // Proceder con la creación
    } else {
      console.log('⚠️  Ya existen contadores en la base de datos.');
      console.log('💡 Si quieres resetearlos, borra manualmente la colección "contadores" en Firebase Console.');
      return false; // No proceder
    }
  } catch (error) {
    console.error('❌ Error verificando contadores:', error);
    return true; // Proceder por si acaso
  }
}

// Ejecutar con verificación
async function main() {
  const shouldProceed = await checkExistingCounters();
  
  if (shouldProceed) {
    await createCounters();
  } else {
    console.log('❌ Ejecución cancelada.');
    process.exit(0);
  }
}

main();