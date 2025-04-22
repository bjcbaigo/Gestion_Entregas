import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Rutas de autenticación
router.post('/login', authController.login);
router.get('/verify', authMiddleware, authController.verificarToken);

export default router;