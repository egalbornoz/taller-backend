
import { clientsList, dataClient, deleteClientQuery, updateClientQuery } from "../models/client.js";
import { db } from '../database/config.js';
// ------------------------------------------------------------------------------
//   Metodo para crear un usuario
// ------------------------------------------------------------------------------
export const createClient = async (req, res) => {
    const sql = dataClient();
    // Validamos que venga el body (opcional, pero recomendado)
    if (!req.body) {
        return res.status(400).json({ message: 'No se enviaron datos' });
    }
    const { nombre, telefono, email, direccion } = req.body;
    try {
        const pool = await db();
        // 1. Preparar datos
        const created_at = new Date();
        const updated_at = new Date();


        // El orden del array debe coincidir EXACTAMENTE con los ? de arriba
        const values = [nombre, telefono, email, direccion, 1, created_at, updated_at];

        // 3. Ejecutar
        const result = await pool.query(sql, values);

        // 4. Devolver a React el objeto tal cual lo necesita la tabla
        res.status(201).json({
            id: result.insertId, // ID que acaba de generar la base de datos
            nombre: nombre,
            email: email,
            telefono: telefono,
            direccion: direccion,
            activo: 1
            // Agrega otros campos si los muestras en la tabla
        });

    } catch (error) {
        console.error('Error al intentar crear el cliente', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// ------------------------------------------------------------------------------
//   Metodo para actualizar un  clientes
// ------------------------------------------------------------------------------
// --- NUEVO MÉTODO PARA ACTUALIZAR ---
export const updateClient = async (req, res) => {
    const { id } = req.params; // El ID viene por la URL
    const { nombre, telefono, email, direccion } = req.body;

    if (!nombre || !email) {
        return res.status(400).json({ message: 'Nombre y Email son obligatorios' });
    }

    try {
        const sql = updateClientQuery();
        const pool = await db();

        const updated_at = new Date();

        // Orden exacto de los ?: nombre, telefono, email, updated_at, id
        const values = [nombre, telefono, email, direccion, updated_at, id];

        const result = await pool.query(sql, values);

        // Verificamos si realmente se actualizó algo (si el ID existe)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado correctamente',
            data: { id, nombre, telefono, email, direccion }
        });

    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ message: 'Error interno al actualizar el cliente' });
    }
};
// ------------------------------------------------------------------------------
//   Metodo para obtenber todos los clientes
// ------------------------------------------------------------------------------

export const getClients = async (req = require, res = response) => {
    const sql = clientsList();
    const { activo } = req.params;
    console.log("ACTIVO:", activo);
    let cientActivo = activo;

    if (activo == 'false') { cientActivo = 0; }
    if (activo == 'true') { cientActivo = 1; }

    console.log("Cliente-ACTIVO:", cientActivo);
    try {
        const pool = await db();

        const resultado = await pool.query(sql, [cientActivo]);
        const rows = resultado.recordset;
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clientes no encontrados',
            });
        }
        // Devolvemos el primer objeto encontrado
        res.status(200).json({
            success: true,
            message: 'Información de clientes recuperada',
            data: rows
        });

    } catch (error) {
        console.error('Error al obtener los clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// --- ELIMINAR (DESACTIVAR) CLIENTE ---
export const deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        const sql = deleteClientQuery();
        const pool = await db();
        const updated_at = new Date();

        const result = await pool.query(sql, [updated_at, id]);
        console.log(id)

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.json({
            success: true,
            message: 'Cliente eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ message: 'Error interno al eliminar el cliente' });
    }
};
// backend/controllers/clients.js (Añadir al final)

export const getClientProfile = async (req, res) => {
    const { id } = req.params;
    
    try {
        const pool = await db(); // Usamos tu instancia

        // 1. Datos personales del cliente
        const resClient = await pool.query(`SELECT * FROM clientes WHERE id = ?`, [id]);
        const cliente = (resClient.recordset || resClient)[0];
        
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

        // 2. Sus Vehículos
        const resVehicles = await pool.query(`SELECT * FROM vehiculos WHERE cliente_id = ?`, [id]);
        const vehiculos = resVehicles.recordset || (Array.isArray(resVehicles[0]) ? resVehicles[0] : resVehicles);

        // 3. Sus Módulos ECU
        const resModules = await pool.query(`SELECT * FROM modulos_ecu WHERE cliente_id = ?`, [id]);
        const modulos = resModules.recordset || (Array.isArray(resModules[0]) ? resModules[0] : resModules);

        // 4. Su Historial de Órdenes y Gastos
        const resOrders = await pool.query(`
            SELECT id, estado, motivo_ingreso, monto_presupuesto, created_at, vehiculo_id, modulo_id
            FROM ordenes 
            WHERE cliente_id = ? 
            ORDER BY created_at DESC
        `, [id]);
        const ordenes = resOrders.recordset || (Array.isArray(resOrders[0]) ? resOrders[0] : resOrders);

        // Calcular total gastado (Solo de órdenes aprobadas, reparadas o entregadas)
        const totalGastado = ordenes.reduce((acc, curr) => {
            if (['APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'].includes(curr.estado)) {
                return acc + (Number(curr.monto_presupuesto) || 0);
            }
            return acc;
        }, 0);

        res.json({
            ok: true,
            data: {
                cliente,
                vehiculos: vehiculos || [],
                modulos: modulos || [],
                ordenes: ordenes || [],
                totalGastado
            }
        });

    } catch (error) {
        console.error("Error obteniendo perfil del cliente:", error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};