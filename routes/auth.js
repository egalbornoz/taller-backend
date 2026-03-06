import { check } from 'express-validator';
import { Router } from 'express';
import { login } from '../controllers/auth.js';
import { validField } from '../middlewares/field-validate.js';
import { userExistForEmail } from '../helpers/db-validators.js';



const router = Router();

// -----------------------------------------------------------------------
//     ENDPOINT PARA HACER LOGIN  http://localhost:3000/api/auth/login
// -----------------------------------------------------------------------

router.post('/login', [
     check('email', 'El correo es obligatorio').not().isEmpty(),
     check('email', 'El formato del correo no es válido').isEmail(),
     // Validamos si existe. Si la función lanza error, el validador lo captura.
     check('email').custom(userExistForEmail), 
     check('password_hash', 'La contraseña es obligatoria').not().isEmpty(),
     validField
], login);

export default router;