// src/routes/auth.js - Rutas de autenticación

import express from 'express';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// Públicas
router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/google', AuthController.loginWithGoogle);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protegidas
router.get('/me', AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);

export default router;
