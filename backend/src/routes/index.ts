import { Router } from 'express';
import pedidosRoutes from './pedidos.routes';
import sucursalesRoutes from './sucursales.routes';
import usuariosRoutes from './usuarios.routes';
import authRoutes from './auth.routes';

const router = Router();

// Versión de la API
const API_VERSION = process.env.API_VERSION || 'v1';
const baseUrl = `/${API_VERSION}`;

// Rutas de la API
router.use(`${baseUrl}/pedidos`, pedidosRoutes);
router.use(`${baseUrl}/sucursales`, sucursalesRoutes);
router.use(`${baseUrl}/usuarios`, usuariosRoutes);
router.use(`${baseUrl}/auth`, authRoutes);

export default router;