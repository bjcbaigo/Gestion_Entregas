import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurar que el directorio de uploads existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `firma-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos: solo permitir imágenes
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'));
  }
};

// Configuración de Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB máximo
  }
});

// Middleware para subir firma
export const uploadFirma = upload.single('firma');

// Middleware para manejar errores de upload
export const handleUploadErrors = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Errores de Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande' });
    }
    return res.status(400).json({ message: `Error de upload: ${err.message}` });
  } else if (err) {
    // Otros errores
    return res.status(400).json({ message: err.message });
  }
  next();
};