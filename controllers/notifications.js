import { db } from '../database/config.js';
import { dataNotification, pendingNotifications, markAsSentQuery } from "../models/notifications.js";

// ------------------------------------------------------------------------------
// Crear una nueva notificación (poner en cola)
// ------------------------------------------------------------------------------
export const createNotification = async (req, res) => {
    const { orden_id, canal, destino, mensaje } = req.body;

    try {
        const sql = dataNotification();
        const pool = await db();
        const fecha = new Date();

        // Por defecto enviado es false (0)
        const values = [orden_id || null, canal, destino, mensaje, 0, fecha];
        const result = await pool.query(sql, values);

        res.status(201).json({
            success: true,
            message: 'Notificación puesta en cola',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear notificación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ------------------------------------------------------------------------------
// Obtener notificaciones pendientes
// ------------------------------------------------------------------------------
export const getPendingNotifications = async (req, res) => {
    try {
        const sql = pendingNotifications();
        const pool = await db();
        const result = await pool.query(sql);
        const rows = result.recordset || result;

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        res.status(500).json({ message: 'Error al consultar cola de envíos' });
    }
};

// ------------------------------------------------------------------------------
// Marcar notificación como enviada
// ------------------------------------------------------------------------------
export const updateSentStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const sql = markAsSentQuery();
        const pool = await db();
        const result = await pool.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.json({ success: true, message: 'Estado de envío actualizado' });
    } catch (error) {
        console.error('Error al actualizar estado de notificación:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};