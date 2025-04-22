import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno según el ambiente
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const dbName = process.env.DB_NAME || 'entregas_dev';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');

// Crear instancia de Sequelize
export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: env === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

export default sequelize;