import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { upload } from '../middlewares/upload.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { 
    cerrarDiagnostico, 
    createRevision, 
    getAllRevisiones, 
    getRevisionesByDate, 
    getRevisionesByOrden, 
    updateRevision 
} from '../controllers/reviews.js';

const router = Router();

// ====================================================================
// GET - Lista todas las revisiones
// ====================================================================
router.get('/', validarJWT, getAllRevisiones);

// ====================================================================
// GET - Obtiene la revision por ID de la orden
// ====================================================================
router.get('/orden/:orden_id', [
    validarJWT,
    check('orden_id', 'ID de orden no válido').isInt(),
    validField
], getRevisionesByOrden);

// ====================================================================
// GET - Reporte por fechas
// ====================================================================
router.get('/reporte/fechas', [
    validarJWT,
    tieneRol('ADMIN'), 
    validField
], getRevisionesByDate);

// ====================================================================
// POST - Crear Revisión (CON MULTER)
// ====================================================================
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION', 'TECNICO'),
    upload.single('video_diagnostico'), // <-- MULTER DEBE IR AQUÍ
    check('orden_id', 'La orden es obligatoria').not().isEmpty(),
    check('diagnostico', 'El diagnóstico es obligatorio').not().isEmpty(),
    validField
], createRevision);

// ====================================================================
// PUT - Actualizar Revisión (CON MULTER)
// ====================================================================
router.put('/update/:id', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION', 'TECNICO'),
    upload.single('video_diagnostico'), // <-- MULTER DEBE IR AQUÍ
    check('id', 'ID de revisión no válido').isInt(),
    check('diagnostico', 'El diagnóstico es obligatorio').not().isEmpty(),
    validField
], updateRevision);

// ====================================================================
// PATCH PARA CERRAR EL DIAGNOSTICO
// ====================================================================
router.patch('/close/:id', [
    validarJWT,
    tieneRol('ADMIN', 'TECNICO', 'RECEPCION'),
    check('id', 'ID no válido').isInt(),
    validField
], cerrarDiagnostico);

export default router;