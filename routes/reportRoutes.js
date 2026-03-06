import { Router } from 'express';
import { check } from 'express-validator';
import { getFinalReport } from '../controllers/reportController.js';

// Ajusta estas rutas a la ubicación real de tus middlewares
import { validarJWT } from '../middlewares/validar-jwt.js'; 
import { tieneRol } from '../middlewares/validar-roles.js';
import { validField } from '../middlewares/validar-campos.js';

const router = Router();

// Ruta protegida para el reporte de auditoría final
router.get('/audit/final', [
    validarJWT,
    tieneRol('ADMIN'), // Ajusta el rol según tu base de datos
    check('inicio', 'La fecha de inicio es obligatoria y debe tener formato ISO8601').isISO8601(),
    check('fin', 'La fecha de fin es obligatoria y debe tener formato ISO8601').isISO8601(),
    validField
], getFinalReport);

export default router;