// server.js - Punto de entrada del backend

import 'dotenv/config.js';
import app from './src/app.js';

const PORT = process.env.PORT || 8081;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 NextNodes Backend Running      ║
╠════════════════════════════════════════╣
║  Port:    ${PORT}
║  Env:     ${NODE_ENV}
║  API URL: http://localhost:${PORT}/api/v1
╚════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('📊 SIGTERM recibido. Cerrando...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});
