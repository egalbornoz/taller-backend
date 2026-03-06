import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { createColaborator, getColaborators } from '../controllers/colaborators.js';

const router = Router();

router.use(validarJWT); // Protegemos todas las rutas
router.get('/', getColaborators);
router.post('/create', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    validField
], createColaborator);

export default router;