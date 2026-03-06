import { Router } from 'express';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { getMovimientos, createMovimiento } from '../controllers/movimientos.js';


const router = Router();

router.get('/', validarJWT, getMovimientos);

router.post('/create', validarJWT, createMovimiento);

export default router;