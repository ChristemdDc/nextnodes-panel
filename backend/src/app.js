import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// SEGURIDAD
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar CSP para permitir scripts inline y assets locales en desarrollo
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// PARSERS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/v1/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// RUTAS API
app.use('/api/v1/auth', authRoutes);

// SERVIR FRONTEND ESTÁTICO (sólo en desarrollo local / MVP)
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(frontendPath));

// Redirigir la raíz index.html al frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 para API
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint no encontrado' 
  });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
});

export default app;
