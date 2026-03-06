import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { createNotification, getPendingNotifications, updateSentStatus } from '../controllers/notifications.js';

const router = Router();

// POST - Crear notificación
router.post('/create', [
    validarJWT,
    check('canal', 'El canal debe ser EMAIL o WHATSAPP').isIn(['EMAIL', 'WHATSAPP']),
    check('destino', 'El destino (correo o celular) es obligatorio').not().isEmpty(),
    check('mensaje', 'El mensaje es obligatorio').not().isEmpty(),
    validField
], createNotification);

// GET - Ver pendientes (Admin o Sistemas)
router.get('/pending', [
    validarJWT,
    tieneRol('ADMIN')
], getPendingNotifications);

// PUT - Marcar como enviada
router.put('/sent/:id', [
    validarJWT,
    check('id', 'ID no válido').isInt(),
    validField
], updateSentStatus);

export default router;