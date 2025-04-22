import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import routes from './routes';
import { initializeModels } from './models';
import path from 'path';
import sincronizacionService from './services/sincronizacion.service';

// Cargar variables de entorno según el ambiente
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api', routes);

// Ruta básica de estado
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', environment: env });
});

// Manejo global de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

// Iniciar el servidor
const startServer = async () => {
  try {
    // Inicializar relaciones entre modelos
    initializeModels();
    
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos con la base de datos (en desarrollo)
    if (env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados con la base de datos.');
    }
    
    // Iniciar sincronización programada
    sincronizacionService.programarSincronizacion();
    
    // Iniciar el servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Ambiente: ${env}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
  }
};

startServer();

// Para testing
export default app;