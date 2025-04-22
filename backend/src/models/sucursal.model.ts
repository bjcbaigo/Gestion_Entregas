import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario } from './usuario.model';
import { Pedido } from './pedido.model';

export interface SucursalAttributes {
  id: number;
  nombre: string;
  direccion: string;
  localidad: string;
  codigoPostal: string;
  telefono?: string;
  email?: string;
  activa: boolean;
}

export class Sucursal extends Model<SucursalAttributes> implements SucursalAttributes {
  public id!: number;
  public nombre!: string;
  public direccion!: string;
  public localidad!: string;
  public codigoPostal!: string;
  public telefono?: string;
  public email?: string;
  public activa!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sucursal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    localidad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    codigoPostal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'sucursales',
  }
);

// Relaciones
export const initSucursalRelations = () => {
  Sucursal.hasMany(Usuario, { foreignKey: 'sucursalId', as: 'usuarios' });
  Sucursal.hasMany(Pedido, { foreignKey: 'sucursalId', as: 'pedidos' });
};

export default Sucursal;