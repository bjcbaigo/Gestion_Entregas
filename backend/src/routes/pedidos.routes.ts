import { Router } from 'express';
import { PedidosController } from '../controllers/pedidos.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { uploadFirma, handleUploadErrors } from '../middlewares/upload.middleware';

const router = Router();
const pedidosController = new PedidosController();

// Rutas para pedidos
router.get('/', authMiddleware, pedidosController.getAllPedidos);
router.get('/pendientes', authMiddleware, pedidosController.getPedidosPendientes);
router.get('/:id', authMiddleware, pedidosController.getPedidoById);
router.post('/asignar/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'OPERADOR']), 
  pedidosController.asignarPedido
);
router.post('/confirmar/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'SUCURSAL']), 
  uploadFirma, 
  handleUploadErrors, 
  pedidosController.confirmarEntrega
);
router.get('/sucursal/:sucursalId', authMiddleware, pedidosController.getPedidosBySucursal);

export default router;