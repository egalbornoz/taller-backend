import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { getHistoryByOrder, createHistoryRecord } from '../controllers/orders_history.js';

const router = Router();

// GET - Obtener la linea de tiempo de una orden: /api/v1/history/15
router.get('/:orden_id', [
    validarJWT,
    check('orden_id', 'ID de orden no válido').isInt(),
    validField
], getHistoryByOrder);

// POST - Registro manual (Opcional, usualmente es automático)
router.post('/create', [
    validarJWT,
    check('orden_id', 'La orden es obligatoria').isInt(),
    check('estado', 'Estado no válido').isIn(['RECIBIDO', 'EN_REVISION', 'PRESUPUESTADO', 'APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO', 'CANCELADO']),
    validField
], createHistoryRecord);

export default router;