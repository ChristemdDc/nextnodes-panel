import express from 'express';
import app from './src/app.js';

// Middleware de inspección
app.use((req, res, next) => {
  if (req.path.includes('/auth')) {
    console.log(`\n🔍 [INSPECTION] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    if (req.body && req.body.password) {
      console.log('Password Length:', req.body.password.length);
      console.log('Password Type:', typeof req.body.password);
    }
  }
  next();
});

console.log('🛠️ Inspector de peticiones activado.');
