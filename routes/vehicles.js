// src/routes/vehicles.js
import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { upload } from '../middlewares/upload.js'; // IMPORTAMOS MULTER
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from '../controllers/vehicle.js';

const router = Router();

//====================================================================
// POST - Crear Vehículo (Agregamos upload.single('img_documento'))
//====================================================================
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'), // Asegúrate de dar acceso a recepción si lo necesitas
    upload.single('img_documento'), // <-- MULTER INTERCEPTA EL ARCHIVO AQUÍ
    check('cliente_id', 'El ID del cliente es obligatorio').not().isEmpty(),
    check('marca', 'La marca es obligatoria').not().isEmpty(),
    check('placa', 'La placa es obligatoria').not().isEmpty(),
    validField
], createVehicle);

//====================================================================
// GET - Listar todos los vehículos
//====================================================================
router.get('/', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION', 'TECNICO') // Añadí más roles que podrían necesitar ver la lista
], getVehicles);

//====================================================================
// PUT - Actualizar Vehículo (Agregamos upload.single('img_documento'))
//====================================================================
router.put('/update/:id', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'),
    upload.single('img_documento'), // <-- MULTER INTERCEPTA EL ARCHIVO AQUÍ
    check('id', 'ID de vehículo no válido').isInt(),
    check('cliente_id', 'El ID del cliente es obligatorio').not().isEmpty(),
    validField
], updateVehicle);

//====================================================================
// DELETE - Eliminar Vehículo
//====================================================================
router.delete('/delete/:id', [
    validarJWT,
    tieneRol('ADMIN'), // Solo admin borra físicamente
    check('id', 'ID de vehículo no válido').isInt(),
    validField
], deleteVehicle);

export default router;