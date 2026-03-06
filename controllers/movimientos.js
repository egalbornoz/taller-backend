import { db } from '../database/config.js';

// Leer todos los movimientos
export const getMovimientos = async (req, res) => {
    try {
        const pool = await db();
        const resultado = await pool.query(`
            SELECT m.*, u.nombre as usuario 
            FROM movimientos m 
            INNER JOIN usuarios u ON m.usuario_id = u.id 
            ORDER BY m.created_at DESC
        `);
        const movimientos = resultado.recordset || (Array.isArray(resultado[0]) ? resultado[0] : resultado);
        res.json({ success: true, data: movimientos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener movimientos' });
    }
};

// Registrar un nuevo Gasto/Ingreso
export const createMovimiento = async (req, res) => {
    const { tipo, concepto, monto } = req.body;
    const usuario_id = req.usuario.id || req.user.id; // Del token

    if (!concepto || !monto) return res.status(400).json({ message: 'Concepto y monto son obligatorios' });

    try {
        const pool = await db();
        await pool.query(
            `INSERT INTO movimientos (tipo, concepto, monto, usuario_id) VALUES (?, ?, ?, ?)`,
            [tipo || 'EGRESO', concepto, monto, usuario_id]
        );
        res.status(201).json({ success: true, message: 'Movimiento registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el movimiento' });
    }
};