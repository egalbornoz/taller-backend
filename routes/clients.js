import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { createClient, deleteClient, getClientProfile, getClients, updateClient } from '../controllers/clients.js';
import { searhEmail } from '../helpers/db-validators.js';



const router = Router();
//--------------------------------------------------------------------------------------------------------------
//  END POINT PARA CREAR UN clientes        POST -   http://localhost:3000/api/v1/clients/create  header x-token
// -------------------------------------------------------------------------------------------------------------
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El correo  no es valido').isEmail(),
    check('email', 'El correo es obligatorio').not().isEmpty(),
    check('telefono', 'El rol telefono obligatorio').not().isEmpty(),
    check('email').custom(searhEmail),
    validField
], createClient);
//--------------------------------------------------------------------------------------------------------------
//  END POINT PARA LISTAR TOSDOS LOS clientes        POST -   http://localhost:3000/api/v1/clients/  header x-token
// -------------------------------------------------------------------------------------------------------------
router.get('/:activo', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION')],
    getClients);

//--------------------------------------------------------------------------------------------------------------
//  END POINT PARA CREAR UN clientes        POST -   http://localhost:3000/api/v1/clients/update/:id  header x-token
// -------------------------------------------------------------------------------------------------------------
router.put('/update/:id', [
    validarJWT,
    tieneRol('ADMIN'), // O los roles que decidas
    check('id', 'No es un ID válido').isInt(), // Validar que sea número (opcional pero bueno)
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    validField
], updateClient);

//--------------------------------------------------------------------------------------------------------------
//  END POINT PARA ELIMINAR UN cliente       PUT -   http://localhost:3000/api/v1/clients/delete/:id  header x-token
// -------------------------------------------------------------------------------------------------------------
router.put('/delete/:id', [
    validarJWT,
    tieneRol('ADMIN'), // Solo admin debería poder borrar
    check('id', 'ID inválido').isInt(),
    validField
], deleteClient);

router.get('/profile/:id',
    validarJWT,
    getClientProfile);

export default router;