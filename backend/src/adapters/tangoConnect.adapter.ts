import axios from 'axios';
import { Pedido } from '../models/pedido.model';

// Interfaces para Tango Connect
interface TangoConnectAuth {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface TangoFactura {
  NumeroFactura: string;
  FechaFactura: string;
  Cliente: {
    Codigo: string;
    RazonSocial: string;
    Direccion: string;
    Localidad: string;
    CodigoPostal: string;
    Telefono: string;
    Email: string;
    CUIT: string;
  };
  Items: Array<{
    Codigo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioUnitario: number;
    Total: number;
  }>;
  Total: number;
  Estado: string;
}

export class TangoConnectAdapter {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.TANGO_CONNECT_URL || '';
    this.clientId = process.env.TANGO_CONNECT_CLIENT_ID || '';
    this.clientSecret = process.env.TANGO_CONNECT_CLIENT_SECRET || '';
  }

  /**
   * Autenticación con Tango Connect usando OAuth 2.0
   */
  private async authenticate(): Promise<string> {
    // Si ya tenemos un token válido, lo retornamos
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<TangoConnectAuth>(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'read write',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      
      // Calcular expiración (restamos 5 minutos para margen de seguridad)
      const expirySeconds = response.data.expires_in - 300;
      this.tokenExpiry = new Date(Date.now() + expirySeconds * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error al autenticar con Tango Connect:', error);
      throw new Error('Error de autenticación con Tango Connect');
    }
  }

  /**
   * Obtener facturas pendientes de entrega desde Tango
   */
  public async obtenerFacturasPendientes(): Promise<Pedido[]> {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get<TangoFactura[]>(
        `${this.baseUrl}/api/facturas/pendientes-entrega`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Mapear las facturas de Tango a nuestro modelo de Pedido
      const pedidos: Partial<Pedido>[] = response.data.map((factura) => ({
        numeroFactura: factura.NumeroFactura,
        fechaFactura: new Date(factura.FechaFactura),
        cliente: factura.Cliente.RazonSocial,
        direccionEntrega: factura.Cliente.Direccion,
        localidad: factura.Cliente.Localidad,
        estado: 'PENDIENTE',
      }));

      // Convertir a instancias de Pedido y guardar en BD
      const pedidosCreados = await Promise.all(
        pedidos.map(async (pedido) => {
          const [createdPedido] = await Pedido.findOrCreate({
            where: { numeroFactura: pedido.numeroFactura },
            defaults: pedido as any,
          });
          return createdPedido;
        })
      );

      return pedidosCreados;
    } catch (error) {
      console.error('Error al obtener facturas pendientes:', error);
      throw new Error('Error al consultar facturas pendientes en Tango Connect');
    }
  }

  /**
   * Actualizar estado de una factura en Tango
   */
  public async actualizarEstadoFactura(
    numeroFactura: string,
    estado: string,
    datosEntrega?: {
      dniReceptor: string;
      fechaEntrega: Date;
    }
  ): Promise<boolean> {
    try {
      const token = await this.authenticate();
      
      await axios.post(
        `${this.baseUrl}/api/facturas/${numeroFactura}/actualizar-estado`,
        {
          estado,
          ...(datosEntrega && {
            dniReceptor: datosEntrega.dniReceptor,
            fechaEntrega: datosEntrega.fechaEntrega.toISOString(),
          }),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Error al actualizar estado de factura:', error);
      throw new Error('Error al actualizar estado en Tango Connect');
    }
  }

  /**
   * Configurar webhook para recibir notificaciones de cambios en facturas
   */
  public async configurarWebhook(callbackUrl: string): Promise<boolean> {
    try {
      const token = await this.authenticate();
      
      await axios.post(
        `${this.baseUrl}/api/webhooks/configurar`,
        {
          event: 'factura.nueva',
          callback_url: callbackUrl,
          active: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Error al configurar webhook:', error);
      throw new Error('Error al configurar webhook en Tango Connect');
    }
  }
}

export default new TangoConnectAdapter();