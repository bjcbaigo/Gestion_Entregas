import tangoConnectAdapter from '../adapters/tangoConnect.adapter';
import { Pedido } from '../models/pedido.model';
import { Op } from 'sequelize';

export class SincronizacionService {
  /**
   * Sincroniza pedidos pendientes desde Tango Connect
   */
  public async sincronizarPedidosPendientes(): Promise<void> {
    try {
      console.log('Iniciando sincronización de pedidos pendientes...');
      
      // Obtener facturas pendientes desde Tango Connect
      const pedidosSync = await tangoConnectAdapter.obtenerFacturasPendientes();
      
      console.log(`Se sincronizaron ${pedidosSync.length} pedidos desde Tango Connect`);
    } catch (error) {
      console.error('Error en la sincronización de pedidos:', error);
      throw error;
    }
  }

  /**
   * Sincroniza el estado de los pedidos hacia Tango Connect
   */
  public async sincronizarEstadosPedidos(): Promise<void> {
    try {
      console.log('Iniciando sincronización de estados de pedidos a Tango Connect...');
      
      // Obtener pedidos que han sido entregados pero no sincronizados
      const pedidosEntregados = await Pedido.findAll({
        where: {
          estado: 'ENTREGADO',
          // Podemos agregar un campo para marcar si ya se sincronizó
          // sincronizado: false
        }
      });
      
      // Actualizar estado en Tango Connect
      for (const pedido of pedidosEntregados) {
        await tangoConnectAdapter.actualizarEstadoFactura(
          pedido.numeroFactura,
          'ENTREGADO',
          {
            dniReceptor: pedido.dniReceptor || '',
            fechaEntrega: pedido.fechaEntrega || new Date(),
          }
        );
        
        // Marcar como sincronizado
        // await pedido.update({ sincronizado: true });
      }
      
      console.log(`Se sincronizaron ${pedidosEntregados.length} estados de pedidos a Tango Connect`);
    } catch (error) {
      console.error('Error en la sincronización de estados de pedidos:', error);
      throw error;
    }
  }

  /**
   * Configura un cron job para sincronización periódica
   */
  public programarSincronizacion(): void {
    // En un entorno real, usaríamos una biblioteca como 'node-cron'
    // para programar estas tareas periódicamente
    
    // Ejemplo con setInterval (para desarrollo)
    const INTERVALO_SYNC = 15 * 60 * 1000; // 15 minutos
    
    setInterval(async () => {
      try {
        await this.sincronizarPedidosPendientes();
        await this.sincronizarEstadosPedidos();
      } catch (error) {
        console.error('Error en la sincronización programada:', error);
      }
    }, INTERVALO_SYNC);
    
    console.log('Sincronización programada configurada correctamente');
  }
}

export default new SincronizacionService();