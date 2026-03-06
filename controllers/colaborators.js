import { db } from '../database/config.js';
import { queryAllCollaborators, insertCollaborator } from '../models/colaborators.js';


// ==========================================
// 1. OBTENER TODOS LOS COLABORADORES
// ==========================================
export const getColaborators = async (req, res) => {
    try {
        const pool = await db();
        // Buscamos a los colaboradores ordenados alfabéticamente
        const resultado = await pool.query(`SELECT * FROM colaboradores ORDER BY nombre ASC`);
        
        // Extracción blindada (Soporta múltiples librerías de MySQL)
        const rows = resultado.recordset || (Array.isArray(resultado[0]) ? resultado[0] : resultado);

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        // AQUÍ ESTABA EL ERROR FANTASMA: Ahora sí nos va a gritar en la consola
        console.error('🔥 Error crítico en getColaborators:', error);
        res.status(500).json({ message: 'Error interno al obtener colaboradores', error: error.message });
    }
};

// ==========================================
// 2. CREAR UN NUEVO COLABORADOR RAPIDO
// ==========================================
export const createColaborator = async (req, res) => {
    const { nombre, especialidad, telefono } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del colaborador es obligatorio' });
    }

    try {
        const pool = await db();
        const resultado = await pool.query(
            `INSERT INTO colaboradores (nombre, especialidad, telefono) VALUES (?, ?, ?)`,
            [nombre, especialidad || '', telefono || '']
        );

        const nuevoId = resultado.insertId || resultado[0]?.insertId;

        res.status(201).json({
            success: true,
            message: 'Colaborador registrado',
            data: { id: nuevoId, nombre, especialidad, telefono }
        });
    } catch (error) {
        console.error('🔥 Error crítico en createColaborator:', error);
        res.status(500).json({ message: 'Error interno al crear colaborador', error: error.message });
    }
};