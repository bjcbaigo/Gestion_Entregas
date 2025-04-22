import { Pedido, initPedidoRelations } from './pedido.model';
import { Usuario } from './usuario.model';
import { Sucursal, initSucursalRelations } from './sucursal.model';

// Exportar todos los modelos
export { Pedido, Usuario, Sucursal };

// Inicializar todas las relaciones
export const initializeModels = () => {
  initPedidoRelations();
  initSucursalRelations();
  
  // Usuario.belongsTo(Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
  
  console.log('Modelos inicializados correctamente');
};

export default {
  Pedido,
  Usuario,
  Sucursal,
  initializeModels,
};