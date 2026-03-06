import { Router } from 'express';

import { getTarifas, createTarifa, updateTarifa, deleteTarifa } from '../controllers/tariffs.js';
import { validarJWT } from '../middlewares/validar-jwt.js';


const router = Router();

router.get('/', validarJWT, getTarifas);
router.post('/create', validarJWT, createTarifa);
router.put('/:id', validarJWT, updateTarifa);
router.delete('/:id', validarJWT, deleteTarifa);

export default router;