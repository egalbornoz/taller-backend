import { db } from '../database/config.js';
import { reparacionListByTechnician, dataReparacion, reparacionListByOrder, reparacionByDateRange, allRepairsList, updtRepair } from "../models/repairs.js";

export const createReparacion = async (req, res) => {
    const { orden_id, descripcion, costo_reparacion } = req.body;
    const tecnico_id = req.usuario.id;
    const video_reparacion = req.file ? req.file.filename : null; // <-- CAPTURAMOS EL VIDEO

    try {
        const sql = dataReparacion();
        const pool = await db();
        const fecha = new Date();

        const values = [orden_id, tecnico_id, descripcion, costo_reparacion || 0, fecha, video_reparacion];
        const result = await pool.query(sql, values);
        req.app.get('io').emit('actualizacion_taller');
        res.status(201).json({ success: true, message: 'Reparación registrada correctamente', id: result.insertId });
    } catch (error) {
        console.error('Error al crear reparación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const updateRepair = async (req, res) => {
    const { id } = req.params;
    const { descripcion, costo_reparacion } = req.body;
    const video_reparacion = req.file ? req.file.filename : null; // <-- CAPTURAMOS EL VIDEO

    try {
        const pool = await db();
        const sql = updtRepair();

        // Extractor blindado para la validación
        const resRep = await pool.query(`SELECT id FROM reparaciones WHERE id = ?`, [id]);
        let rows = [];
        if (Array.isArray(resRep)) rows = Array.isArray(resRep[0]) ? resRep[0] : resRep;
        else if (resRep && typeof resRep === 'object') rows = resRep.recordset || resRep.rows || resRep.data || [];

        if (rows.length === 0) return res.status(404).json({ message: 'Reparación no encontrada' });

        // Ejecutamos el UPDATE con el video
        await pool.query(sql, [descripcion, costo_reparacion || 0, video_reparacion, id]);
        req.app.get('io').emit('actualizacion_taller');
        res.json({ success: true, message: 'Reparación actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar reparación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
export const getReparacionesByOrden = async (req, res) => {
    const { orden_id } = req.params;
    try {
        const sql = reparacionListByOrder();
        const pool = await db();
        const result = await pool.query(sql, [orden_id]);

        res.json({
            success: true,
            data: result.recordset || result
        });
    } catch (error) {
        console.error('Error al obtener reparaciones:', error);
        res.status(500).json({ message: 'Error al consultar reparaciones' });
    }
};
export const getReparacionesByTecnico = async (req, res) => {
    const { tecnico_id } = req.params;

    try {
        const sql = reparacionListByTechnician();
        const pool = await db();
        const result = await pool.query(sql, [tecnico_id]);
        const rows = result.recordset || result;

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener reparaciones por técnico:', error);
        res.status(500).json({ message: 'Error al consultar historial del técnico' });
    }
};

// ----------------------------------------------------
// Obtener reparaciones por fecha o rango (CORREGIDO)
// ----------------------------------------------------
export const getReparacionesByDate = async (req, res) => {
    const { inicio, fin } = req.query;

    if (!inicio) {
        return res.status(400).json({ message: 'La fecha de inicio es obligatoria (YYYY-MM-DD)' });
    }

    const fechaFin = fin || inicio;

    try {
        const sql = reparacionByDateRange();
        const pool = await db();

        const result = await pool.query(sql, [inicio, fechaFin]);

        // --- EXTRACTOR BLINDADO (Para evitar el error del paquete doble) ---
        let rows = [];
        if (Array.isArray(result)) {
            if (Array.isArray(result[0])) {
                rows = result[0];
            } else {
                rows = result;
            }
        } else if (result && typeof result === 'object') {
            rows = result.recordset || result.rows || result.data || [];
        }
        if (!Array.isArray(rows)) rows = [];

        // Ahora sí, sumamos los costos de forma segura
        const totalAcumulado = rows.reduce((acc, curr) => acc + Number(curr.costo_reparacion || 0), 0);

        res.json({
            success: true,
            count: rows.length,
            rango: { desde: inicio, hasta: fechaFin },
            total_periodo: totalAcumulado,
            data: rows
        });
    } catch (error) {
        console.error('Error al filtrar reparaciones por fecha:', error);
        res.status(500).json({ message: 'Error interno al generar reporte por fechas' });
    }
};
// NUEVA FUNCIÓN: Obtener TODAS las reparaciones (Filtro Inteligente por Rol)

// ====================================================================
// GET - Obtener TODAS las reparaciones (Filtro Inteligente por Rol)
// ====================================================================
export const getAllReparaciones = async (req, res) => {
    try {
        const pool = await db();
        let sql;
        let values = [];

        // 1. Identificamos si quien pide la lista es un técnico
        const esTecnico =
            req.usuario.nombre_rol === 'TECNICO' ||
            req.usuario.rol === 'TECNICO' ||
            String(req.usuario.rol_id) === '3';

        console.log("--- PIDIENDO LISTA DE REPARACIONES ---");
        console.log(`Usuario: ${req.usuario.nombre} | ID: ${req.usuario.id}`);

        if (esTecnico) {
            // Asegúrate de que este modelo en src/models/repairs.js use LEFT JOIN para vehículos/módulos
            sql = reparacionListByTechnician();
            values = [req.usuario.id];
            console.log(`-> Ejecutando consulta estricta para el Técnico ID: ${req.usuario.id}`);
        } else {
            sql = allRepairsList();
            console.log("-> Ejecutando consulta General (Admin/Recepción)");
        }

        // 2. Ejecutamos la consulta a la BD
        const result = await pool.query(sql, values);

        // 3. EXTRACTOR BLINDADO MULTI-DRIVER
        let rows = [];

        if (Array.isArray(result)) {
            if (Array.isArray(result[0])) {
                rows = result[0]; // Formato nativo mysql2: [ [datos], [columnas] ]
            } else {
                rows = result; // Formato array limpio
            }
        } else if (result && typeof result === 'object') {
            // Si el driver lo empaqueta como un objeto
            rows = result.recordset || result.rows || result.data || [];
        }

        // Si por alguna razón sigue sin ser un array, forzamos uno vacío para que React no explote
        if (!Array.isArray(rows)) {
            console.log("⚠️ ALERTA: La base de datos devolvió un formato desconocido:", result);
            rows = [];
        }

        console.log(`-> Formato de salida corregido.`);
        console.log(`-> Reparaciones enviadas a React: ${rows.length}`);
        console.log("--------------------------------------");

        // 4. Enviamos la respuesta limpia a React
        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error al obtener reparaciones:', error);
        res.status(500).json({ message: 'Error al consultar el historial de reparaciones' });
    }
};
export const generarGarantia = async (req, res) => {
    const { id } = req.params; // ID de la reparación que falló
    const asignado_por = req.usuario.id; // Admin que autoriza la garantía

    try {
        const pool = await db();

        // 1. Obtener la data original
        const sqlGet = repairDetailsForWarranty();
        const rows = await pool.query(sqlGet, [id]);
        const data = rows[0];

        if (!data) return res.status(404).json({ message: 'Reparación original no encontrada' });

        // 2. Construir el motivo
        const motivo = `REINGRESO POR GARANTÍA. Relacionado a reparación previa: "${data.descripcion.substring(0, 50)}..."`;

        // 3. Crear NUEVA ORDEN automática
        const sqlInsert = `
            INSERT INTO ordenes 
            (cliente_id, vehiculo_id, modulo_id, motivo_ingreso, estado, es_garantia, asignado_por, tecnico_id, created_at) 
            VALUES (?, ?, ?, ?, 'EN_REVISION', TRUE, ?, ?, NOW())
        `;

        const values = [
            data.cliente_id,
            data.vehiculo_id || null,
            data.modulo_id || null,
            motivo,
            asignado_por,
            data.tecnico_id // <-- Asignación directa al técnico responsable
        ];

        const result = await pool.query(sqlInsert, values);
        req.app.get('io').emit('actualizacion_taller');
        res.json({
            success: true,
            message: 'Orden de garantía generada exitosamente.',
            nueva_orden_id: result.insertId
        });

    } catch (error) {
        console.error('Error al generar garantía:', error);
        res.status(500).json({ message: 'Error interno al procesar la garantía' });
    }
};