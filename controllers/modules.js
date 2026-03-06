import { dataModule, modulesList, updateModuleQuery, deleteModuleQuery } from "../models/modules.js";
import { db } from '../database/config.js';
import fs from 'fs/promises';
import path from 'path';

export const createModule = async (req, res) => {
    const sql = dataModule();
    const { cliente_id, tipo, marca, modelo, numero_parte, serial, observaciones, tipo_combustible } = req.body;
    const img_documento = req.file ? req.file.filename : null;

    try {
        const pool = await db();
        const created_at = new Date();
        const values = [cliente_id, tipo, marca, modelo, numero_parte, serial, observaciones, img_documento, tipo_combustible, created_at];
        const result = await pool.query(sql, values);
        res.status(201).json({ success: true, message: 'Módulo registrado exitosamente.', id: result.insertId });
    } catch (error) {
        console.error('Error al intentar crear el módulo', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const updateModule = async (req, res) => {
    const { id } = req.params;
    const { cliente_id, tipo, marca, modelo, numero_parte, serial, observaciones, tipo_combustible } = req.body;

    try {
        const pool = await db();
        const resultado = await pool.query(`SELECT img_documento FROM modulos_ecu WHERE id = ?`, [id]);
        const rows = resultado.recordset || resultado;

        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Módulo no encontrado' });

        const moduloActual = rows[0];
        let nuevoImgDocumento = moduloActual.img_documento;

        if (req.file) {
            nuevoImgDocumento = req.file.filename;
            if (moduloActual.img_documento) {
                const rutaImagenVieja = path.join(process.cwd(), 'public', 'uploads', moduloActual.img_documento);
                try { await fs.unlink(rutaImagenVieja); } catch (err) { console.warn(`No se pudo borrar imagen anterior: ${err.message}`); }
            }
        }

        const sql = updateModuleQuery();
        const values = [cliente_id, tipo, marca, modelo, numero_parte, serial, observaciones, nuevoImgDocumento, tipo_combustible, id];
        await pool.query(sql, values);
        res.json({ success: true, message: 'Módulo actualizado correctamente' });

    } catch (error) {
        console.error('Error al actualizar el módulo:', error);
        res.status(500).json({ message: 'Error interno al actualizar' });
    }
};

export const getModules = async (req, res) => {
    const sql = modulesList();
    try {
        const pool = await db();
        const resultado = await pool.query(sql);
        const rows = resultado.recordset || resultado;
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener módulos' });
    }
};

export const deleteModule = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();
        const resImg = await pool.query(`SELECT img_documento FROM modulos_ecu WHERE id = ?`, [id]);
        const rowsImg = resImg.recordset || resImg;

        const sql = deleteModuleQuery();
        const result = await pool.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Módulo no encontrado' });

        if (rowsImg[0] && rowsImg[0].img_documento) {
            const rutaImagen = path.join(process.cwd(), 'public', 'uploads', rowsImg[0].img_documento);
            try { await fs.unlink(rutaImagen); } catch (err) { }
        }
        res.json({ success: true, message: 'Módulo eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
};