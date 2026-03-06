import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';

// ↓ IMPORTA EL MIDDLEWARE QUE USAS PARA SUBIR ARCHIVOS (Ajusta la ruta si es necesario) ↓
import { upload } from '../middlewares/upload.js'; 

import { createReparacion, generarGarantia, getAllReparaciones, getReparacionesByDate, getReparacionesByOrden, getReparacionesByTecnico, updateRepair } from '../controllers/repairs.js';

const router = Router();

router.get('/', [validarJWT], getAllReparaciones);

// ↓ SE AGREGA EL MIDDLEWARE UPLOAD AQUÍ ↓
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'TECNICO'),
    upload.single('video_reparacion'), // Permite recibir el video
    check('orden_id', 'ID de orden es requerido').not().isEmpty(),
    check('descripcion', 'La descripción del trabajo es obligatoria').not().isEmpty(),
    validField
], createReparacion);

router.get('/orden/:orden_id', [validarJWT, check('orden_id', 'ID de orden no válido').isInt(), validField], getReparacionesByOrden);
router.get('/tecnico/:tecnico_id', [validarJWT, check('tecnico_id', 'ID de técnico no válido').isInt(), validField], getReparacionesByTecnico);
router.get('/reporte/fechas', [validarJWT, tieneRol('ADMIN'), validField], getReparacionesByDate);

// ↓ SE AGREGA EL MIDDLEWARE UPLOAD AQUÍ ↓
router.put('/:id', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION', 'TECNICO'),
    upload.single('video_reparacion'), // Permite actualizar el video
    check('id', 'ID de reparación no válido').isInt(),
    validField
], updateRepair);

router.post('/garantia/:id', [validarJWT, tieneRol('ADMIN', 'RECEPCION'), check('id', 'ID no válido').isInt(), validField], generarGarantia);

export default router;