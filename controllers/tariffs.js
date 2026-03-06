import { db } from '../database/config.js';

// OBTENER TODAS LAS TARIFAS
export const getTarifas = async (req, res) => {
    try {
        const pool = await db();
        const resultado = await pool.query(`SELECT * FROM tarifas_revision ORDER BY tipo_entidad ASC, costo ASC`);
        const rows = resultado.recordset || (Array.isArray(resultado[0]) ? resultado[0] : resultado);
        
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener tarifas:', error);
        res.status(500).json({ message: 'Error al obtener tarifas' });
    }
};

// CREAR TARIFA
export const createTarifa = async (req, res) => {
    const { tipo_entidad, categoria, costo } = req.body;
    if (!tipo_entidad || !categoria || costo === undefined) return res.status(400).json({ message: 'Faltan datos' });

    try {
        const pool = await db();
        await pool.query(`INSERT INTO tarifas_revision (tipo_entidad, categoria, costo) VALUES (?, ?, ?)`, 
            [tipo_entidad, categoria, costo]);
        res.status(201).json({ success: true, message: 'Tarifa creada con éxito' });
    } catch (error) {
        console.error('Error al crear tarifa:', error);
        res.status(500).json({ message: 'Error al crear tarifa' });
    }
};

// ACTUALIZAR TARIFA
export const updateTarifa = async (req, res) => {
    const { id } = req.params;
    const { tipo_entidad, categoria, costo } = req.body;

    try {
        const pool = await db();
        await pool.query(`UPDATE tarifas_revision SET tipo_entidad = ?, categoria = ?, costo = ? WHERE id = ?`, 
            [tipo_entidad, categoria, costo, id]);
        res.status(200).json({ success: true, message: 'Tarifa actualizada' });
    } catch (error) {
        console.error('Error al actualizar tarifa:', error);
        res.status(500).json({ message: 'Error al actualizar tarifa' });
    }
};

// ELIMINAR TARIFA
export const deleteTarifa = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();
        await pool.query(`DELETE FROM tarifas_revision WHERE id = ?`, [id]);
        res.status(200).json({ success: true, message: 'Tarifa eliminada' });
    } catch (error) {
        console.error('Error al eliminar tarifa:', error);
        res.status(500).json({ message: 'Error al eliminar tarifa' });
    }
};