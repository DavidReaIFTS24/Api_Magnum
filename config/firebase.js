const admin = require('firebase-admin');
const path = require('path');

try {
  // Cargar desde archivo JSON
  const serviceAccount = require('./firebase-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  console.log('🔥 Firebase conectado correctamente');
  console.log(`📊 Proyecto: ${serviceAccount.project_id}`);

  module.exports = { admin, db };
  
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message);
  
  // Fallback: intentar con variable de entorno simple
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'marroquineria-magnum-61e65'
    });
    
    const db = admin.firestore();
    console.log('⚠️  Firebase en modo desarrollo (sin autenticación completa)');
    
    module.exports = { admin, db };
  } catch (fallbackError) {
    console.error('🚨 No se pudo inicializar Firebase:', fallbackError.message);
    console.log('💡 Solución:');
    console.log('   1. Crea config/firebase-key.json con las credenciales');
    console.log('   2. O usa Firebase Emulator para desarrollo');
    
    // Exportar null para que el servidor al menos inicie
    module.exports = { admin: null, db: null };
  }
}