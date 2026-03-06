import { db } from '../database/config.js';
import {
    dataRevision,
    revisionListByOrder,
    updateRevisionQuery,
    allRevisionsList,
    revisionByDateRange,
    allRevisionsListByTecnico
} from "../models/reviews.js"; // Asegúrate de que el nombre del archivo coincida (tienes un typo en tu mensaje 'reviesw.js', ajustalo a 'reviews.js')

// ====================================================================
// POST - Crear Revisión
// ====================================================================
export const createRevision = async (req, res) => {
    const { orden_id, diagnostico, costo_revision } = req.body;
    const video_diagnostico = req.file ? req.file.filename : null;
    const tecnico_id = req.usuario.id; // Obtenido del token JWT seguro

    try {
        const sql = dataRevision();
        const pool = await db();
        const fecha = new Date();
        const values = [orden_id, tecnico_id, diagnostico, video_diagnostico, costo_revision || 0.00, fecha];
        const result = await pool.query(sql, values);

        // Opcional pero recomendado: Actualizar la orden a "DIAGNOSTICO" o "PRESUPUESTADO"
        const updateOrdenSql = `UPDATE ordenes SET estado = 'PRESUPUESTADO' WHERE id = ?`;
        await pool.query(updateOrdenSql, [orden_id]);
        req.app.get('io').emit('actualizacion_taller');
        res.status(201).json({
            success: true,
            message: 'Diagnóstico de revisión guardado',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear revisión:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear revisión' });
    }
};

// ====================================================================
// GET - Obtener revisiones de una Orden específica
// ====================================================================
export const getRevisionesByOrden = async (req, res) => {
    const { orden_id } = req.params;
    try {
        const sql = revisionListByOrder();
        const pool = await db();
        const result = await pool.query(sql, [orden_id]);

        res.json({
            success: true,
            data: result.recordset || result
        });
    } catch (error) {
        console.error('Error al obtener revisiones:', error);
        res.status(500).json({ message: 'Error al consultar revisiones de la orden' });
    }
};
// ====================================================================
// PUT - Actualizar Revisión
// ====================================================================
import fs from 'fs/promises';
import path from 'path';

export const updateRevision = async (req, res) => {
    const { id } = req.params;
    const { diagnostico, costo_revision } = req.body;

    try {
        const pool = await db();

        // 1. Buscar video anterior en la base de datos
        const resultado = await pool.query(`SELECT video_diagnostico FROM revisiones WHERE id = ?`, [id]);

        // Extraemos las filas correctamente
        const rows = Array.isArray(resultado) && Array.isArray(resultado[0])
            ? resultado[0]
            : (resultado.recordset || resultado);

        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Revisión no encontrada' });

        let nuevoVideo = rows[0].video_diagnostico;

        // 2. Si el técnico subió un nuevo archivo de video
        if (req.file) {
            nuevoVideo = req.file.filename;

            // Si ya existía un video viejo, lo borramos del disco duro para no ocupar espacio
            if (rows[0].video_diagnostico) {
                const rutaVieja = path.join(process.cwd(), 'public', 'uploads', rows[0].video_diagnostico);
                try {
                    await fs.unlink(rutaVieja);
                } catch (err) {
                    console.warn(`No se pudo borrar video viejo: ${err.message}`);
                }
            }
        }

        // 3. ¡AQUÍ ESTÁ LA CORRECCIÓN! Ejecutamos el UPDATE en la base de datos
        const sql = updateRevisionQuery();
        await pool.query(sql, [diagnostico, nuevoVideo, costo_revision || 0, id]);
        req.app.get('io').emit('actualizacion_taller');
        res.json({
            success: true,
            message: 'Diagnóstico actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar revisión:', error);
        res.status(500).json({ message: 'Error interno al actualizar diagnóstico' });
    }
};

// ====================================================================
// GET - Obtener TODAS las revisiones (Filtro Inteligente por Rol)
// ====================================================================
export const getAllRevisiones = async (req, res) => {
    try {
        const pool = await db();
        let sql;
        let values = [];

        // 1. Imprimimos en la consola del backend para ver la estructura real de req.usuario
        console.log("=== DATOS DEL USUARIO LOGUEADO ===", req.usuario);

        // 2. Validación robusta: Buscamos el rol en las propiedades más comunes
        // (Ajusta el '3' si tu ID para técnicos en la base de datos es otro)
        const esTecnico =
            req.usuario.nombre_rol === 'TECNICO' ||
            req.usuario.rol === 'TECNICO' ||
            req.usuario.rol_id === 3 ||
            req.usuario.id_rol === 3;

        if (esTecnico) {
            console.log("Ejecutando consulta filtrada para TÉCNICO ID:", req.usuario.id);
            sql = allRevisionsListByTecnico();
            values = [req.usuario.id];
        } else {
            console.log("Ejecutando consulta GENERAL para ADMIN/RECEPCION");
            sql = allRevisionsList();
        }

        const result = await pool.query(sql, values);

        res.json({
            success: true,
            data: result.recordset || result
        });

    } catch (error) {
        console.error('Error al obtener revisiones generales:', error);
        res.status(500).json({ message: 'Error al consultar listado de revisiones' });
    }
};
// ====================================================================
// GET - Reporte por fechas (Para vista del Administrador)
// ====================================================================
export const getRevisionesByDate = async (req, res) => {
    const { inicio, fin } = req.query;

    if (!inicio) {
        return res.status(400).json({ message: 'La fecha de inicio es obligatoria (YYYY-MM-DD)' });
    }

    const fechaFin = fin || inicio;

    try {
        const sql = revisionByDateRange();
        const pool = await db();

        // Ejecución segura de la consulta
        const result = await pool.query(sql, [inicio, fechaFin]);
        const rows = result.recordset || result; // Extracción correcta del arreglo

        // Cálculo financiero del periodo
        const totalAcumulado = rows.reduce((acc, curr) => acc + Number(curr.costo_revision), 0);

        res.json({
            success: true,
            count: rows.length,
            rango: { desde: inicio, hasta: fechaFin },
            total_periodo: totalAcumulado,
            data: rows
        });
    } catch (error) {
        console.error('Error al filtrar revisiones por fecha:', error);
        res.status(500).json({ message: 'Error interno al generar reporte de revisiones por fechas' });
    }
};
// =========================================================================================
//   CERRAR EL DIAGNOSTICO
// =========================================================================================
export const cerrarDiagnostico = async (req, res) => {
    const { id } = req.params; // ID de la revisión
    const usuario_id = req.usuario.id;

    try {
        const pool = await db();

        // 1. Obtenemos a qué orden pertenece esta revisión (MÉTODO SEGURO)
        const resultado = await pool.query(`SELECT orden_id FROM revisiones WHERE id = ?`, [id]);

        // Extraemos las filas adaptándonos a tu driver
        const rows = resultado.recordset || resultado;

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Revisión no encontrada' });
        }

        // Tomamos el primer resultado
        const revision = rows[0];
        const orden_id = revision.orden_id; // ¡Ahora sí tendrá el número correcto!

        // 2. Actualizamos el estado de la orden
        await pool.query(`UPDATE ordenes SET estado = 'DIAGNOSTICADO', updated_at = NOW() WHERE id = ?`, [orden_id]);

        // 3. Registramos el movimiento en el historial
        await pool.query(`
            INSERT INTO orden_estado_historial (orden_id, estado, cambiado_por, fecha) 
            VALUES (?, 'DIAGNOSTICADO', ?, NOW())
        `, [orden_id, usuario_id]);
        req.app.get('io').emit('actualizacion_taller');
        res.json({ success: true, message: 'Diagnóstico cerrado correctamente' });

    } catch (error) {
        console.error('Error al cerrar diagnóstico:', error);
        res.status(500).json({ message: 'Error interno al cerrar el diagnóstico' });
    }
};