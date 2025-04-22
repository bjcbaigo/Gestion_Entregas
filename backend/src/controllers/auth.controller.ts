import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuario.model';

export class AuthController {
  /**
   * Login de usuarios
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Validar datos
      if (!email || !password) {
        res.status(400).json({ message: 'Email y contraseña son requeridos' });
        return;
      }
      
      // Buscar usuario
      const usuario = await Usuario.findOne({ where: { email } });
      
      if (!usuario) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }
      
      // Verificar contraseña
      const passwordValida = await usuario.validarPassword(password);
      
      if (!passwordValida) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }
      
      // Verificar que usuario esté activo
      if (!usuario.activo) {
        res.status(403).json({ message: 'Usuario desactivado' });
        return;
      }
      
      // Generar token
      const token = this.generarToken(usuario);
      
      // Respuesta
      res.status(200).json({
        message: 'Login exitoso',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          sucursalId: usuario.sucursalId
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Error en el proceso de login' });
    }
  }

  /**
   * Validar token actual
   */
  public async verificarToken(req: Request, res: Response): Promise<void> {
    try {
      // El middleware auth ya verificó el token
      const usuario = req.user;
      
      res.status(200).json({
        message: 'Token válido',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          sucursalId: usuario.sucursalId
        }
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({ message: 'Error al verificar token' });
    }
  }

  /**
   * Generar token JWT
   */
  private generarToken(usuario: Usuario): string {
    const secretKey = process.env.JWT_SECRET || 'default_secret_key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    
    const payload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    };
    
    return jwt.sign(payload, secretKey, { expiresIn });
  }
}

export default new AuthController();