// src/controllers/vehicle.js
import { dataVehicle, vehiclesList, updateVehicleQuery, deleteVehicleQuery } from "../models/vehicle.js";
import { db } from '../database/config.js';

// --- IMPORTACIONES NUEVAS PARA BORRAR ARCHIVOS ---
import fs from 'fs/promises'; // Usamos la versión con promesas para usar await
import path from 'path';
// ------------------------------------------------

// ------------------------------------------------------------------------------
// Metodo para crear un vehiculo (SIN CAMBIOS)
// ------------------------------------------------------------------------------
export const createVehicle = async (req, res) => {
    const sql = dataVehicle();
    const { cliente_id, marca, modelo, anio, placa, vin, tipo_combustible } = req.body;
    // ...
    const img_documento = req.file ? req.file.filename : null;

    try {
        const pool = await db();
        const created_at = new Date();
        const values = [cliente_id, marca, modelo, anio, placa, vin, img_documento, tipo_combustible, created_at];
        const result = await pool.query(sql, values);
        res.status(201).json({
            success: true, message: 'Vehículo registrado exitosamente.', id: result.insertId
        });
    } catch (error) {
        console.error('Error al intentar crear el vehículo', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ------------------------------------------------------------------------------
// Metodo para actualizar un vehiculo (CON LÓGICA DE BORRADO)
// ------------------------------------------------------------------------------
export const updateVehicle = async (req, res) => {
    const { id } = req.params;
    const { cliente_id, marca, modelo, anio, placa, vin, tipo_combustible } = req.body;

    try {
        const pool = await db();

        // 1. Obtener el vehículo actual para saber si tiene imagen vieja
        const resultado = await pool.query(`SELECT img_documento FROM vehiculos WHERE id = ?`, [id]);
        const rows = resultado.recordset || resultado;

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        const vehiculoActual = rows[0];

        // --- INICIO LÓGICA DE BORRADO DE IMAGEN ANTERIOR ---

        // Por defecto, la nueva imagen es la que ya tenía
        let nuevoImgDocumento = vehiculoActual.img_documento;

        // Si el usuario SUBIÓ UN NUEVO ARCHIVO
        if (req.file) {
            // 1. Actualizamos la variable con el nombre del archivo nuevo
            nuevoImgDocumento = req.file.filename;

            // 2. Verificamos si EXISTÍA una imagen vieja para borrarla
            if (vehiculoActual.img_documento) {
                // Construimos la ruta completa al archivo viejo. 
                // Usamos process.cwd() para asegurar que la ruta sea correcta desde la raíz del proyecto.
                const rutaImagenVieja = path.join(process.cwd(), 'public', 'uploads', vehiculoActual.img_documento);

                try {
                    // Intentamos borrar el archivo físico
                    await fs.unlink(rutaImagenVieja);
                    console.log(`[INFO] Imagen anterior eliminada: ${vehiculoActual.img_documento}`);
                } catch (errorBorrado) {
                    // Si falla el borrado (ej: alguien borró la imagen manualmente antes), 
                    // solo advertimos en consola, NO detenemos la actualización de la DB.
                    console.warn(`[WARN] No se pudo borrar la imagen anterior (${rutaImagenVieja}): ${errorBorrado.message}`);
                }
            }
        }
        // --- FIN LÓGICA DE BORRADO ---


        // 3. Ejecutar la actualización en la BD con el nombre definitivo
        const sql = updateVehicleQuery();
        // Usamos la variable 'nuevoImgDocumento' que calculamos arriba
        const values = [cliente_id, marca, modelo, anio, placa, vin, nuevoImgDocumento, tipo_combustible, id];

        await pool.query(sql, values);

        res.json({ success: true, message: 'Vehículo actualizado correctamente' });

    } catch (error) {
        console.error('Error al actualizar el vehículo:', error);
        res.status(500).json({ message: 'Error interno al actualizar' });
    }
};

// ------------------------------------------------------------------------------
// Metodo para obtener todos los vehiculos (SIN CAMBIOS)
// ------------------------------------------------------------------------------
export const getVehicles = async (req, res) => {
    const sql = vehiclesList();
    try {
        const pool = await db();
        const resultado = await pool.query(sql);
        const rows = resultado.recordset || resultado;
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener vehículos' });
    }
};

// ------------------------------------------------------------------------------
// Metodo para eliminar un vehiculo (BLINDADO CON INTEGRIDAD REFERENCIAL)
// ------------------------------------------------------------------------------
export const deleteVehicle = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();

        // 🛡️ PASO 0: BLINDAJE ANTI-ORfandad (Verificar si tiene órdenes)
        const checkOrders = await pool.query(`SELECT COUNT(*) as total FROM ordenes WHERE vehiculo_id = ?`, [id]);
        const ordersData = checkOrders.recordset || (Array.isArray(checkOrders[0]) ? checkOrders[0] : checkOrders);
        const totalOrders = ordersData[0]?.total || ordersData.total || 0;

        if (totalOrders > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `¡Acción denegada! Este vehículo está vinculado a ${totalOrders} orden(es) de servicio. No se puede borrar por seguridad contable.` 
            });
        }

        // 1. Antes de borrar de la BD, obtenemos el nombre de la imagen
        const resImg = await pool.query(`SELECT img_documento FROM vehiculos WHERE id = ?`, [id]);
        const rowsImg = resImg.recordset || (Array.isArray(resImg[0]) ? resImg[0] : resImg);

        const sql = deleteVehicleQuery();
        const result = await pool.query(sql, [id]);
        
        // Manejo seguro del resultado dependiendo del driver de MySQL
        const affectedRows = result.affectedRows !== undefined ? result.affectedRows : (result[0]?.affectedRows || 0);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }

        // 2. Si se borró de la BD, intentamos borrar la imagen física si existía
        if (rowsImg[0] && rowsImg[0].img_documento) {
            const rutaImagen = path.join(process.cwd(), 'public', 'uploads', rowsImg[0].img_documento);
            try {
                await fs.unlink(rutaImagen);
                console.log(`[INFO] Imagen de vehículo borrada: ${rowsImg[0].img_documento}`);
            } catch (err) {
                console.warn(`[WARN] No se pudo borrar imagen física: ${err.message}`);
            }
        }

        res.json({ success: true, message: 'Vehículo eliminado correctamente del sistema' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno al intentar eliminar el vehículo' });
    }
};