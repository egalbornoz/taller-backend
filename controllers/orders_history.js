import { db } from '../database/config.js';
import { dataHistory, historyByOrder } from "../models/orders_history.js";

// ------------------------------------------------------------------------------
// Metodo para registrar manualmente un hito en el historial
// ------------------------------------------------------------------------------
export const createHistoryRecord = async (req, res) => {
    const { orden_id, estado } = req.body;
    const cambiado_por = req.usuario.id; // Extraído del token JWT

    try {
        const sql = dataHistory();
        const pool = await db();
        const fecha = new Date();

        await pool.query(sql, [orden_id, estado, cambiado_por, fecha]);

        res.status(201).json({
            success: true,
            message: 'Historial actualizado'
        });
    } catch (error) {
        console.error('Error al registrar historial:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ------------------------------------------------------------------------------
// Metodo para obtener la linea de tiempo de una orden (Timeline)
// ------------------------------------------------------------------------------
export const getHistoryByOrder = async (req, res) => {
    const { orden_id } = req.params;

    try {
        const sql = historyByOrder();
        const pool = await db();
        const result = await pool.query(sql, [orden_id]);
        const rows = result.recordset || result;

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay historial para esta orden'
            });
        }

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al consultar la linea de tiempo' });
    }
};