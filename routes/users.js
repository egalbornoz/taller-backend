import { Router } from 'express';
import { check } from 'express-validator';
import {
    createUser, getActiveTechnicians, getRoles,
    getUser, getUsers, getUsersByRole, updateUser, toggleStatus,
    cambiarMiPassword
} from '../controllers/users.js';
import { validField } from '../middlewares/field-validate.js';
import { existUserId, searhEmail } from '../helpers/db-validators.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';

const router = Router();

// ==========================================
// RUTAS ESPECÍFICAS (Deben ir primero)
// ==========================================

// Obtener solo técnicos activos
router.get('/active-technicians', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION')
], getActiveTechnicians);

// Obtener Roles
router.get('/roles', [
    validarJWT,
    tieneRol('ADMIN')
], getRoles);

// Buscar por rol específico
router.get('/role/:rol', [
    validarJWT,
    tieneRol('ADMIN')
], getUsersByRole);

// ==========================================
// RUTAS PRINCIPALES DE USUARIO (CRUD)
// ==========================================

// Listar todos
router.get('/', [
    validarJWT,
    tieneRol('ADMIN')
], getUsers);

// Crear usuario
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN'),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El correo no es valido').isEmail(),
    check('rol_id', 'El rol es obligatorio').not().isEmpty(),
    // check('email').custom(searhEmail), <- Si tienes un validador propio, descoméntalo
    check('password', 'La contraseña debe tener minimo 6 caracteres').isLength({ min: 6 }),
    validField
], createUser);
// Cambiar estado activo/inactivo
router.patch('/toggle-status/:id', [
    validarJWT,
    tieneRol('ADMIN'),
    check('id', 'ID no válido').isInt(),
    validField
], toggleStatus);

// ==========================================
// RUTAS CON PARÁMETROS GENÉRICOS (Deben ir de último)
// ==========================================

// Obtener por ID
router.get('/:id', [
    validarJWT,
    tieneRol('ADMIN')
], getUser);

// =======================================================================
//   Ruta para cambiar password
// =======================================================================
router.put('/change-password', validarJWT, cambiarMiPassword);
// =======================================================================
// Actualizar usuario
// =======================================================================
router.put('/:id', [
    validarJWT,
    tieneRol('ADMIN'),
    check('id', 'ID no válido').isInt(),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El correo no es valido').isEmail(),
    check('rol_id', 'El rol es obligatorio').not().isEmpty(),
    validField
], updateUser);


export default router;