import { Router } from 'express';
import {
    getInventory,
    createInventoryItem,
    updateInventoryItem,
    toggleInventoryStatus
} from '../controllers/inventory.js';
import { validarJWT } from '../middlewares/validar-jwt.js';



const router = Router();

router.get('/', validarJWT, getInventory);
router.post('/create', validarJWT, createInventoryItem);
router.put('/update/:id', validarJWT, updateInventoryItem);
router.delete('/delete/:id', validarJWT, toggleInventoryStatus);

export default router;