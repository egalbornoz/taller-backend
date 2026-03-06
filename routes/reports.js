import { Router } from 'express';
import { getFinalReport } from '../controllers/reports.js'; // Verifica que apunte al controlador correcto
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

// Esta ruta se convierte en /api/v1/reports/audit
router.get('/audit', [validarJWT], getFinalReport); 

export default router;