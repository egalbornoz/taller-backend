import { Router } from 'express';
import { check } from 'express-validator';
import { validField } from '../middlewares/field-validate.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { tieneRol } from '../middlewares/roles-validate.js';
import { createOrder, getOrders, updateOrder, deleteOrder, getOrdersByStatus, getOrdersByTechnician, asignarTecnico, getDetallesPresupuesto, getDashboardStats, getOrderReceipt, crearGarantia, getDetallesOrden, addDetalleOrden, deleteDetalleOrden } from '../controllers/orders.js';

const router = Router();

// En la lista de rutas (debe ir antes de cualquier router.put o router.delete)
router.get('/:id/receipt', validarJWT, getOrderReceipt);
// Endpoint para crear orden
router.post('/create', [
    validarJWT,
    tieneRol('ADMIN', 'RECEPCION'),
    check('cliente_id', 'ID de cliente obligatorio').isInt(),
    // check('vehiculo_id', 'ID de vehículo obligatorio').isInt(),
    check('estado').optional().isIn(['RECIBIDO', 'EN_REVISION', 'PRESUPUESTADO', 'APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO', 'CANCELADO']),
    validField
], createOrder);

router.post('/:id/garantia',
    validarJWT,
    crearGarantia);

// Listar todas las órdenes
router.get('/', [
    validarJWT
], getOrders);

// Actualizar estado o técnico
router.put('/update/:id', [
    validarJWT,
    check('id', 'ID no válido').isInt(),
    validField
], updateOrder);

// Eliminar orden
router.delete('/delete/:id', [
    validarJWT,
    tieneRol('ADMIN'),
    check('id', 'ID no válido').isInt(),
    validField
], deleteOrder);

router.get('/:id/detalles', validarJWT, getDetallesOrden);
router.post('/:id/detalles', validarJWT, addDetalleOrden);
router.delete('/:id/detalles/:detalleId', validarJWT, deleteDetalleOrden);
// ... (rutas anteriores)

// GET - Filtrar por estado: /api/v1/orders/status/EN_REPARACION
router.get('/status/:estado', [
    validarJWT,
    check('estado', 'Estado no válido').isIn(['RECIBIDO', 'EN_REVISION', 'PRESUPUESTADO', 'APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO', 'CANCELADO']),
    validField
], getOrdersByStatus);

// GET - Filtrar por técnico: /api/v1/orders/technician/5
router.get('/technician/:tecnico_id', [
    validarJWT,
    check('tecnico_id', 'ID de técnico debe ser un número').isInt(),
    validField
], getOrdersByTechnician);

router.put('/assign/:id', validarJWT, asignarTecnico);

router.get('/:id/detalles', validarJWT, getDetallesPresupuesto);
// Añadir esta línea a tus rutas de orders

router.get('/dashboard/stats', validarJWT, getDashboardStats);
// --- NUEVAS RUTAS PARA EL PRESUPUESTO (DETALLES) ---


export default router;
