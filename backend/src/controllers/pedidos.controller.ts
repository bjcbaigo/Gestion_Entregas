import { Request, Response } from 'express';
import { Pedido } from '../models/pedido.model';
import { Sucursal } from '../models/sucursal.model';
import tangoConnectAdapter from '../adapters/tangoConnect.adapter';
import { Op } from 'sequelize';

export class PedidosController {
  /**
   * Obtiene todos los pedidos
   */
  public async getAllPedidos(req: Request, res: Response): Promise<void> {
    try {
      const pedidos = await Pedido.findAll({
        include: ['sucursal', 'usuarioAsignador', 'usuarioEntrega'],
        order: [['fechaFactura', 'DESC']]
      });
      
      res.status(200).json(pedidos);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      res.status(500).json({ message: 'Error al obtener pedidos' });
    }
  }

  /**
   * Obtiene pedidos pendientes (no asignados)
   */
  public async getPedidosPendientes(req: Request, res: Response): Promise<void> {
    try {
      // Sincronizar antes de mostrar
      await tangoConnectAdapter.obtenerFacturasPendientes();
      
      const pedidos = await Pedido.findAll({
        where: {
          estado: 'PENDIENTE'
        },
        order: [['fechaFactura', 'ASC']]
      });
      
      res.status(200).json(pedidos);
    } catch (error) {
      console.error('Error al obtener pedidos pendientes:', error);
      res.status(500).json({ message: 'Error al obtener pedidos pendientes' });
    }
  }

  /**
   * Obtiene un pedido por su ID
   */
  public async getPedidoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const pedido = await Pedido.findByPk(id, {
        include: ['sucursal', 'usuarioAsignador', 'usuarioEntrega']
      });
      
      if (!pedido) {
        res.status(404).json({ message: 'Pedido no encontrado' });
        return;
      }
      
      res.status(200).json(pedido);
    } catch (error) {
      console.error('Error al obtener pedido:', error);
      res.status(500).json({ message: 'Error al obtener pedido' });
    }
  }

  /**
   * Asigna un pedido a una sucursal
   */
  public async asignarPedido(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sucursalId } = req.body;
      const usuarioId = req.user?.id; // Asumiendo que el middleware de auth agrega esta info
      
      if (!sucursalId) {
        res.status(400).json({ message: 'Se requiere el ID de la sucursal' });
        return;
      }
      
      // Verificar si la sucursal existe
      const sucursal = await Sucursal.findByPk(sucursalId);
      if (!sucursal) {
        res.status(404).json({ message: 'Sucursal no encontrada' });
        return;
      }
      
      // Obtener el pedido
      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        res.status(404).json({ message: 'Pedido no encontrado' });
        return;
      }
      
      // Verificar que el pedido esté en estado pendiente
      if (pedido.estado !== 'PENDIENTE') {
        res.status(400).json({ 
          message: 'El pedido no está en estado pendiente',
          estado: pedido.estado 
        });
        return;
      }
      
      // Actualizar el pedido
      await pedido.update({
        sucursalId,
        usuarioAsignadorId: usuarioId,
        estado: 'ASIGNADO',
        fechaAsignacion: new Date()
      });
      
      res.status(200).json({ 
        message: 'Pedido asignado correctamente',
        pedido
      });
    } catch (error) {
      console.error('Error al asignar pedido:', error);
      res.status(500).json({ message: 'Error al asignar pedido' });
    }
  }

  /**
   * Confirma la entrega de un pedido
   */
  public async confirmarEntrega(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { dniReceptor, observaciones } = req.body;
      const usuarioId = req.user?.id; // Asumiendo que el middleware de auth agrega esta info
      
      // Validar datos
      if (!dniReceptor) {
        res.status(400).json({ message: 'Se requiere el DNI del receptor' });
        return;
      }
      
      // Obtener el pedido
      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        res.status(404).json({ message: 'Pedido no encontrado' });
        return;
      }
      
      // Verificar que el pedido esté asignado
      if (pedido.estado !== 'ASIGNADO' && pedido.estado !== 'EN_TRANSITO') {
        res.status(400).json({ 
          message: 'El pedido debe estar asignado o en tránsito para confirmarlo',
          estado: pedido.estado 
        });
        return;
      }
      
      // Verificar que el usuario pertenezca a la sucursal asignada
      // (Aquí se implementaría esta verificación si tuviéramos el modelo de usuario)
      
      // Procesar la imagen de firma si existe
      let imagenFirma = null;
      if (req.file) {
        // Aquí almacenaríamos la imagen (el middleware multer se encargaría de esto)
        imagenFirma = req.file.path;
      }
      
      // Actualizar el pedido
      await pedido.update({
        estado: 'ENTREGADO',
        fechaEntrega: new Date(),
        dniReceptor,
        imagenFirma,
        usuarioEntregaId: usuarioId,
        observaciones
      });
      
      // Actualizar el estado en Tango Connect
      await tangoConnectAdapter.actualizarEstadoFactura(
        pedido.numeroFactura,
        'ENTREGADO',
        {
          dniReceptor,
          fechaEntrega: new Date()
        }
      );
      
      res.status(200).json({ 
        message: 'Entrega confirmada correctamente',
        pedido
      });
    } catch (error) {
      console.error('Error al confirmar entrega:', error);
      res.status(500).json({ message: 'Error al confirmar entrega' });
    }
  }

  /**
   * Obtiene los pedidos asignados a una sucursal
   */
  public async getPedidosBySucursal(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      
      const pedidos = await Pedido.findAll({
        where: {
          sucursalId,
          estado: {
            [Op.in]: ['ASIGNADO', 'EN_TRANSITO']
          }
        },
        order: [['fechaAsignacion', 'ASC']]
      });
      
      res.status(200).json(pedidos);
    } catch (error) {
      console.error('Error al obtener pedidos de sucursal:', error);
      res.status(500).json({ message: 'Error al obtener pedidos de sucursal' });
    }
  }
}

export default new PedidosController();