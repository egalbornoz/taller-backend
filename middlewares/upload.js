// src/middlewares/upload.js
import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Asegúrate de que esta carpeta exista en tu proyecto
        cb(null, 'public/uploads/'); 
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo para evitar nombres duplicados
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Actualiza el fileFilter para aceptar imagenes y videos
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPG, PNG) o videos (MP4, WEBM)'), false);
    }
};

// Actualiza la exportación para subir el límite a 50MB (50 * 1024 * 1024)
export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Límite ampliado a 50MB
    fileFilter: fileFilter
});