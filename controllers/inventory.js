import { db } from '../database/config.js';

// ==========================================
// 1. OBTENER TODO EL INVENTARIO ACTIVO
// ==========================================
export const getInventory = async (req, res) => {
    try {
        const pool = await db();
        // Traemos todo, ordenado alfabéticamente. 
        // Si quieres solo activos, añade: WHERE activo = 1
        const result = await pool.query('SELECT * FROM inventario ORDER BY nombre ASC');
        const items = result.recordset || (Array.isArray(result[0]) ? result[0] : result);

        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 2. CREAR UN NUEVO PRODUCTO/REPUESTO
// ==========================================
export const createInventoryItem = async (req, res) => {
    const { codigo, nombre, descripcion, categoria, stock_actual, stock_minimo, costo_unitario, precio_venta } = req.body;

    if (!nombre || stock_actual === undefined || costo_unitario === undefined || precio_venta === undefined) {
        return res.status(400).json({ success: false, message: 'Nombre, stock, costo y precio son obligatorios.' });
    }

    try {
        const pool = await db();
        
        // Verificamos si el código (SKU) ya existe para evitar duplicados
        if (codigo) {
            const checkCodigo = await pool.query('SELECT id FROM inventario WHERE codigo = ?', [codigo]);
            const existe = checkCodigo.recordset || (Array.isArray(checkCodigo[0]) ? checkCodigo[0] : checkCodigo);
            if (existe.length > 0) {
                return res.status(400).json({ success: false, message: 'El código o SKU ya está registrado.' });
            }
        }

        const sql = `
            INSERT INTO inventario 
            (codigo, nombre, descripcion, categoria, stock_actual, stock_minimo, costo_unitario, precio_venta) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            codigo || null, nombre.trim(), descripcion || null, categoria || 'REPUESTO',
            Number(stock_actual), Number(stock_minimo || 5), Number(costo_unitario), Number(precio_venta)
        ];

        const result = await pool.query(sql, values);
        
        res.status(201).json({ 
            success: true, 
            message: 'Ítem agregado al inventario', 
            id: result.insertId || result[0]?.insertId 
        });

    } catch (error) {
        console.error('Error al crear ítem:', error);
        res.status(500).json({ success: false, message: 'Error al guardar en el inventario' });
    }
};

// ==========================================
// 3. ACTUALIZAR UN PRODUCTO
// ==========================================
export const updateInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, descripcion, categoria, stock_actual, stock_minimo, costo_unitario, precio_venta } = req.body;

    try {
        const pool = await db();
        const sql = `
            UPDATE inventario 
            SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?, 
                stock_actual = ?, stock_minimo = ?, costo_unitario = ?, precio_venta = ?
            WHERE id = ?
        `;
        const values = [
            codigo || null, nombre.trim(), descripcion || null, categoria,
            Number(stock_actual), Number(stock_minimo), Number(costo_unitario), Number(precio_venta), id
        ];

        await pool.query(sql, values);
        res.json({ success: true, message: 'Ítem actualizado correctamente' });

    } catch (error) {
        console.error('Error al actualizar ítem:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el inventario' });
    }
};

// ==========================================
// 4. ELIMINAR LÓGICAMENTE (Desactivar)
// ==========================================
export const toggleInventoryStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();
        // En lugar de hacer DELETE FROM, cambiamos el estado activo (Soft Delete)
        await pool.query('UPDATE inventario SET activo = NOT activo WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Estado del ítem modificado.' });
    } catch (error) {
        console.error('Error al cambiar estado del ítem:', error);
        res.status(500).json({ success: false, message: 'Error al modificar el estado' });
    }
};