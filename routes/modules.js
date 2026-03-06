import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { upload } from '../middlewares/upload.js'; // IMPORTAR MULTER
import { createModule, deleteModule, getModules, updateModule } from '../controllers/modules.js';

const router = Router();

router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'),
    upload.single('img_documento'), // <-- AGREGAR AQUÍ
    check('cliente_id', 'ID de cliente obligatorio').not().isEmpty(),
    check('tipo', 'El tipo es obligatorio').not().isEmpty(),
    check('serial', 'El serial es obligatorio').not().isEmpty(),
    validField
], createModule);

router.get('/', [validarJWT, tieneRol('ADMIN', 'RECEPCION', 'TECNICO')], getModules);

router.put('/update/:id', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'),
    upload.single('img_documento'), // <-- AGREGAR AQUÍ
    check('id', 'ID inválido').isInt(),
    validField
], updateModule);

router.delete('/delete/:id', [
    validarJWT,
    tieneRol('ADMIN'),
    check('id', 'ID inválido').isInt(),
    validField
], deleteModule);

export default router;