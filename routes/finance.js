import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { createMovement, getFinancialStatus } from '../controllers/finance.js';

const router = Router();

// POST - Registrar movimiento (Caja)
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN'), // Solo administradores deben manejar dinero
    check('tipo', 'El tipo debe ser INGRESO o EGRESO').isIn(['INGRESO', 'EGRESO']),
    check('concepto', 'El concepto es obligatorio').not().isEmpty(),
    check('monto', 'El monto debe ser un numero positivo').isFloat({ min: 0.01 }),
    validField
], createMovement);

// GET - Ver estado de caja y movimientos
router.get('/status', [
    validarJWT,
    tieneRol('ADMIN')
], getFinancialStatus);

export default router;