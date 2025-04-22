import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuario.model';

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token de autenticación requerido' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Token de autenticación no proporcionado' });
      return;
    }
    
    // Verificar el token
    const secretKey = process.env.JWT_SECRET || 'default_secret_key';
    const decoded: any = jwt.verify(token, secretKey);
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Añadir el usuario al request
    req.user = usuario;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    
    console.error('Error de autenticación:', error);
    res.status(500).json({ message: 'Error en la autenticación' });
  }
};

// Middleware para verificar roles
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ message: 'No autorizado para esta acción' });
      return;
    }
    
    next();
  };
};