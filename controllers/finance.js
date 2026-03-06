import { db } from '../database/config.js';
import { dataMovement, movementsList, financialSummaryQuery } from "../models/finance.js";

// ------------------------------------------------------------------------------
// Registrar un Ingreso o Egreso
// ------------------------------------------------------------------------------
export const createMovement = async (req, res) => {
    const { orden_id, tipo, concepto, monto } = req.body;

    try {
        const sql = dataMovement();
        const pool = await db();
        const fecha = new Date();

        // El orden_id puede ser null si es un gasto general
        const values = [orden_id || null, tipo, concepto, monto, fecha];
        const result = await pool.query(sql, values);

        res.status(201).json({
            success: true,
            message: 'Movimiento financiero registrado',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ------------------------------------------------------------------------------
// Obtener todos los movimientos y el resumen de caja
// ------------------------------------------------------------------------------
export const getFinancialStatus = async (req, res) => {
    try {
        const pool = await db();
        
        // 1. Obtener lista de movimientos
        const [movementsResult, summaryResult] = await Promise.all([
            pool.query(movementsList()),
            pool.query(financialSummaryQuery())
        ]);

        const movements = movementsResult.recordset || movementsResult;
        const summary = summaryResult.recordset || summaryResult;

        // 2. Calcular balance
        let ingresos = 0;
        let egresos = 0;
        summary.forEach(item => {
            if (item.tipo === 'INGRESO') ingresos = Number(item.total);
            if (item.tipo === 'EGRESO') egresos = Number(item.total);
        });

        res.status(200).json({
            success: true,
            balance_general: {
                total_ingresos: ingresos,
                total_egresos: egresos,
                neto: ingresos - egresos
            },
            data: movements
        });
    } catch (error) {
        console.error('Error al obtener finanzas:', error);
        res.status(500).json({ message: 'Error al consultar caja' });
    }
};