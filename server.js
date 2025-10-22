const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas - manejar errores si Firebase no está disponible
try {
  const authRoutes = require('./routes/auth');
  const usuarioRoutes = require('./routes/usuarios');
  const productoRoutes = require('./routes/productos');
  const categoriaRoutes = require('./routes/categorias');
  const precioRoutes = require('./routes/precios');
  const stockRoutes = require('./routes/stocks');
  const pedidoRoutes = require('./routes/pedidos');

  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/productos', productoRoutes);
  app.use('/api/categorias', categoriaRoutes);
  app.use('/api/precios', precioRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use('/api/pedidos', pedidoRoutes);
  
  console.log('✅ Todas las rutas cargadas');
} catch (error) {
  console.log('⚠️  Algunas rutas no pudieron cargarse:', error.message);
}

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Marroquinería Magnum funcionando!',
    status: 'Servidor activo',
    firebase: 'Verificando conexión...',
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud para verificar Firebase
app.get('/health', async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    if (db) {
      const collections = await db.listCollections();
      res.json({
        status: 'healthy',
        firebase: 'connected',
        collections: collections.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'healthy',
        firebase: 'not connected',
        message: 'Firebase no está disponible',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.json({
      status: 'healthy',
      firebase: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎯 Servidor Magnum corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   👥 Usuarios: http://localhost:${PORT}/api/usuarios`);
  console.log(`   🛍️ Productos: http://localhost:${PORT}/api/productos`);
  console.log(`   📂 Categorías: http://localhost:${PORT}/api/categorias`);
  console.log(`   🏥 Health: http://localhost:${PORT}/health`);
});