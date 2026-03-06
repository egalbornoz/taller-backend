import { dataHistory } from "../models/orders_history.js"; // Importamos el modelo del historial
import { db } from '../database/config.js';
import {
    ordersByStatusQuery, ordersByTechnicianQuery, dataOrder, ordersList,
    deleteOrderQuery,
    orderSigTechnical,
    updateOrderQuery1
} from "../models/orders.js";

//======================================================================================
//  CONTROLADOR PARA CREAR UNA ORDEN DE SERVICIO
//======================================================================================
export const createOrder = async (req, res) => {
    const {
        cliente_id,
        vehiculo_id,
        modulo_id,
        motivo_ingreso, // Dato del frontend
        estado,
        tecnico_id,
        observaciones
    } = req.body;

    const asignado_por = req.usuario ? req.usuario.id : null;

    // Validaciones
    if (!cliente_id) return res.status(400).json({ message: 'El cliente es obligatorio.' });
    if (!vehiculo_id && !modulo_id) return res.status(400).json({ message: 'Debe asignar un vehículo o un módulo.' });
    if (!motivo_ingreso) return res.status(400).json({ message: 'El motivo de ingreso es obligatorio.' });

    try {
        const pool = await db();
        const created_at = new Date();

        // SQL AJUSTADO: Incluye 'motivo_ingreso' explícitamente
        const sql = dataOrder();

        const values = [
            cliente_id,
            vehiculo_id || null,
            modulo_id || null,
            motivo_ingreso,       // Se guarda en su propia columna
            estado || 'RECIBIDO',
            asignado_por,
            tecnico_id || null,
            observaciones || null,
            created_at
        ];

        const result = await pool.query(sql, values);
        req.app.get('io').emit('actualizacion_taller');
        res.status(201).json({
            success: true,
            id: result.insertId,
            message: 'Orden de servicio creada correctamente'
        });

    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.code });
    }
};

// ==========================================================================================
//  Obtener Ordenes
// ==========================================================================================
export const getOrders = async (req, res) => {
    const sql = ordersList();
    try {
        const pool = await db();
        const resultado = await pool.query(sql);
        const rows = resultado.recordset || resultado;

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener ordenes:', error);
        res.status(500).json({ message: 'Error al recuperar listado' });
    }
};

// ------------------------------------------------------------------------------
// Metodo para actualizar orden con HISTORIAL AUTOMÁTICO Y FINANZAS
// ------------------------------------------------------------------------------
export const updateOrder = async (req, res) => {
    const { id } = req.params;
    const {
        cliente_id, vehiculo_id, modulo_id, estado, motivo_ingreso,
        observaciones, tecnico_id, detalles_presupuesto, dias_garantia
    } = req.body;

    try {
        const pool = await db();

        /// --- 1. LECTURA DE SEGURIDAD ---
        const resOrden = await pool.query(`SELECT tecnico_id, monto_presupuesto, indice_garantia FROM ordenes WHERE id = ?`, [id]);
        const ordenData = resOrden.recordset || (Array.isArray(resOrden) && Array.isArray(resOrden[0]) ? resOrden[0] : resOrden) || [];
        const ordenOriginal = ordenData.length > 0 ? ordenData[0] : {};

        let existingTecnico = ordenOriginal.tecnico_id || null;

        if (!existingTecnico && !tecnico_id) {
            const resRev = await pool.query(`SELECT tecnico_id FROM revisiones WHERE orden_id = ? ORDER BY fecha DESC LIMIT 1`, [id]);
            const revData = resRev.recordset || (Array.isArray(resRev) && Array.isArray(resRev[0]) ? resRev[0] : resRev) || [];
            if (revData && revData.length > 0) {
                existingTecnico = revData[0].tecnico_id;
            }
        }

        const tecnicoReal = tecnico_id || existingTecnico || req.usuario.id;

        // --- 2. CÁLCULO DEL PRESUPUESTO (BLINDADO CONTRA BORRADOS) ---
        let monto_presupuesto = ordenOriginal.monto_presupuesto || 0.00;

        if (detalles_presupuesto !== undefined) {
            let detallesArray = typeof detalles_presupuesto === 'string' ? JSON.parse(detalles_presupuesto) : detalles_presupuesto;
            monto_presupuesto = detallesArray.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

            await pool.query(`DELETE FROM presupuesto_detalles WHERE orden_id = ?`, [id]);
            if (detallesArray.length > 0) {
                const sqlInsertDetalle = `INSERT INTO presupuesto_detalles (orden_id, tipo, descripcion, monto) VALUES (?, ?, ?, ?)`;
                for (const item of detallesArray) {
                    await pool.query(sqlInsertDetalle, [id, item.tipo, item.descripcion, item.monto]);
                }
            }
        }

        // --- 3. ACTUALIZAMOS LA ORDEN PRINCIPAL (AHORA CON RELOJ DE GARANTÍA) ---
        const fechaEntregaSQL = estado === 'ENTREGADO' ? 'NOW()' : 'fecha_entrega';
        const diasGarantiaFinal = dias_garantia !== undefined ? Number(dias_garantia) : null;

        const sqlUpdateOrden = `
            UPDATE ordenes 
            SET cliente_id = ?, vehiculo_id = ?, modulo_id = ?, estado = ?, 
                motivo_ingreso = ?, observaciones = ?, tecnico_id = ?, 
                monto_presupuesto = ?, updated_at = NOW(),
                dias_garantia = COALESCE(?, dias_garantia),
                fecha_entrega = ${fechaEntregaSQL}
            WHERE id = ?
        `;

        await pool.query(sqlUpdateOrden, [
            cliente_id, vehiculo_id || null, modulo_id || null, estado,
            motivo_ingreso, observaciones || null, tecnicoReal, monto_presupuesto,
            diasGarantiaFinal, id
        ]);

        // --- 4. PASO A REPARACIÓN AUTOMÁTICA ---
        if (['APROBADO', 'EN_REPARACION'].includes(estado)) {
            const resRep = await pool.query(`SELECT id FROM reparaciones WHERE orden_id = ?`, [id]);
            let rowsRep = [];

            if (resRep.recordset) rowsRep = resRep.recordset;
            else if (Array.isArray(resRep) && Array.isArray(resRep[0])) rowsRep = resRep[0];
            else if (Array.isArray(resRep)) rowsRep = resRep;

            if (rowsRep.length === 0) {
                const sqlInsertReparacion = `
                    INSERT INTO reparaciones (orden_id, tecnico_id, descripcion, costo_reparacion, fecha) 
                    VALUES (?, ?, 'Trabajo de reparación según presupuesto.', ?, NOW())
                `;
                await pool.query(sqlInsertReparacion, [id, tecnicoReal, monto_presupuesto]);
            } else {
                const sqlUpdateReparacion = `UPDATE reparaciones SET costo_reparacion = ?, tecnico_id = ? WHERE orden_id = ?`;
                await pool.query(sqlUpdateReparacion, [monto_presupuesto, tecnicoReal, id]);
            }
        }

        // 🔥 --- 5. MOTOR FINANCIERO AUTOMÁTICO (BLINDADO CONTRA SALTOS Y GARANTÍAS) --- 🔥
        try {
            const resMovs = await pool.query(`SELECT tipo, monto, concepto FROM movimientos WHERE orden_id = ?`, [id]);
            const movimientosExistentes = resMovs.recordset || (Array.isArray(resMovs[0]) ? resMovs[0] : resMovs) || [];

            const tieneIngreso = movimientosExistentes.some(m => m.tipo === 'INGRESO' && m.concepto.includes('Aprobación'));
            const tieneEgresoCosto = movimientosExistentes.some(m => m.tipo === 'EGRESO' && (m.concepto.includes('Costo') || m.concepto.includes('Pérdida')));
            const tieneReverso = movimientosExistentes.some(m => m.tipo === 'EGRESO' && m.concepto.includes('Reverso'));

            const usuarioMov = req.usuario ? req.usuario.id : 1;

            // 🎯 RESPUESTA A TU PREGUNTA 1: LA ZONA DE CAPTURA (No importa si saltan pasos)
            if (['APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'].includes(estado)) {

                // A. INYECCIÓN DE INGRESOS (Cobro al cliente)
                // Como las garantías tienen monto_presupuesto = 0, esto no se ejecutará para ellas.
                if (!tieneIngreso && monto_presupuesto > 0) {
                    const conceptoIngreso = `Aprobación de Presupuesto - Orden #${String(id).padStart(4, '0')}`;
                    await pool.query(
                        `INSERT INTO movimientos (tipo, concepto, monto, usuario_id, orden_id, created_at) VALUES ('INGRESO', ?, ?, ?, ?, NOW())`,
                        [conceptoIngreso, monto_presupuesto, usuarioMov, id]
                    );
                }

                // B. INYECCIÓN DE EGRESOS (Costo del Taller)
                // 🎯 RESPUESTA A TU PREGUNTA 2: Si es una garantía y le meten repuestos, es una PÉRDIDA.
                if (!tieneEgresoCosto) {
                    const resCostos = await pool.query(`SELECT SUM(costo_unitario * cantidad) as total_costo FROM orden_detalles WHERE orden_id = ?`, [id]);
                    const costoArr = resCostos.recordset || (Array.isArray(resCostos[0]) ? resCostos[0] : resCostos);
                    const costoTotal = Number(costoArr[0]?.total_costo || 0);

                    if (costoTotal > 0) {
                        // Inteligencia Contable: Cambiamos el nombre si es una garantía
                        const esGarantia = Number(ordenOriginal.indice_garantia) > 0;
                        const conceptoEgreso = esGarantia
                            ? `Pérdida por Garantía (Insumos) - Orden #${String(id).padStart(4, '0')}`
                            : `Costo de Repuestos/Insumos - Orden #${String(id).padStart(4, '0')}`;

                        await pool.query(
                            `INSERT INTO movimientos (tipo, concepto, monto, usuario_id, orden_id, created_at) VALUES ('EGRESO', ?, ?, ?, ?, NOW())`,
                            [conceptoEgreso, costoTotal, usuarioMov, id]
                        );
                    }
                }
            }
            // SI CANCELAN O RECHAZAN: El reverso de auditoría
            else if (['CANCELADO', 'RECHAZADO'].includes(estado)) {
                if (tieneIngreso && !tieneReverso) {
                    const ingresoOriginal = movimientosExistentes.find(m => m.tipo === 'INGRESO' && m.concepto.includes('Aprobación'));
                    const montoReverso = ingresoOriginal.monto;

                    const conceptoReverso = `Reverso Financiero (Orden ${estado}) - Orden #${String(id).padStart(4, '0')}`;
                    await pool.query(
                        `INSERT INTO movimientos (tipo, concepto, monto, usuario_id, orden_id, created_at) VALUES ('EGRESO', ?, ?, ?, ?, NOW())`,
                        [conceptoReverso, montoReverso, usuarioMov, id]
                    );
                }
            }
        } catch (errFinanzas) {
            console.error("❌ Error en Caja Unificada:", errFinanzas.message);
        }
        try {
            // Verificamos si esta orden ya había descontado stock previamente
            const resOrdenStock = await pool.query(`SELECT stock_descontado FROM ordenes WHERE id = ?`, [id]);
            const ordenStockData = resOrdenStock.recordset ? resOrdenStock.recordset : (Array.isArray(resOrdenStock) ? resOrdenStock[0] : []);
            const fueDescontado = ordenStockData[0]?.stock_descontado || 0;

            const estadosAprobados = ['APROBADO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'];
            const estadosCancelados = ['CANCELADO', 'RECHAZADO'];

            if (estadosAprobados.includes(estado) && !fueDescontado) {
                // A) HAY QUE DESCONTAR STOCK
                // Buscamos solo los detalles que sean del inventario
                const resDetalles = await pool.query(`SELECT inventario_id, cantidad FROM orden_detalles WHERE orden_id = ? AND inventario_id IS NOT NULL`, [id]);
                const itemsInv = resDetalles.recordset ? resDetalles.recordset : (Array.isArray(resDetalles) ? resDetalles[0] : []);

                if (itemsInv.length > 0) {
                    for (const item of itemsInv) {
                        await pool.query(`UPDATE inventario SET stock_actual = stock_actual - ? WHERE id = ?`, [Number(item.cantidad), item.inventario_id]);
                    }
                    await pool.query(`UPDATE ordenes SET stock_descontado = 1 WHERE id = ?`, [id]);
                    console.log(`📦 INVENTARIO: Stock descontado automáticamente para Orden #${id}`);
                }

            } else if (estadosCancelados.includes(estado) && fueDescontado) {
                // B) REVERSO: EL CLIENTE CANCELÓ, DEVOLVEMOS EL STOCK A LA ESTANTERÍA
                const resDetalles = await pool.query(`SELECT inventario_id, cantidad FROM orden_detalles WHERE orden_id = ? AND inventario_id IS NOT NULL`, [id]);
                const itemsInv = resDetalles.recordset ? resDetalles.recordset : (Array.isArray(resDetalles) ? resDetalles[0] : []);

                if (itemsInv.length > 0) {
                    for (const item of itemsInv) {
                        await pool.query(`UPDATE inventario SET stock_actual = stock_actual + ? WHERE id = ?`, [Number(item.cantidad), item.inventario_id]);
                    }
                    await pool.query(`UPDATE ordenes SET stock_descontado = 0 WHERE id = ?`, [id]);
                    console.log(`📦 INVENTARIO: Stock DEVUELTO (Reverso) por Orden #${id} en estado ${estado}`);
                }
            }
        } catch (errInv) {
            console.error("❌ Error silencioso en Motor de Inventario:", errInv.message);
        }
        // --- 7. FIN DEL PROCESO ---
        req.app.get('io').emit('actualizacion_taller');
        res.json({ success: true, message: 'Orden actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        res.status(500).json({ message: 'Error interno al actualizar la orden' });
    }
};

// NUEVA FUNCIÓN: Obtener los detalles de una orden
export const getDetallesPresupuesto = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();
        const resultado = await pool.query(`SELECT * FROM presupuesto_detalles WHERE orden_id = ? ORDER BY id ASC`, [id]);
        res.json({ success: true, data: resultado.recordset || resultado });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalles' });
    }
};

export const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = deleteOrderQuery();
        const pool = await db();
        await pool.query(sql, [id]);
        res.json({ success: true, message: 'Orden eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
};

// ----------------------------------------------------
// Obtener órdenes por Estado (RECIBIDO, TERMINADO, etc)
// ----------------------------------------------------
export const getOrdersByStatus = async (req, res) => {
    const { estado } = req.params;
    const sql = ordersByStatusQuery();

    try {
        const pool = await db();
        const resultado = await pool.query(sql, [estado]);
        const rows = resultado.recordset || resultado;

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error al filtrar por estado:', error);
        res.status(500).json({ message: 'Error interno al filtrar' });
    }
};

// ----------------------------------------------------
// Obtener órdenes asignadas a un Técnico específico
// ----------------------------------------------------
export const getOrdersByTechnician = async (req, res) => {
    const { tecnico_id } = req.params;
    const sql = ordersByTechnicianQuery();

    try {
        const pool = await db();
        const resultado = await pool.query(sql, [tecnico_id]);
        const rows = resultado.recordset || resultado;

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El técnico no tiene órdenes asignadas'
            });
        }

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al filtrar por técnico:', error);
        res.status(500).json({ message: 'Error interno al filtrar' });
    }
};

// =========================================================================
// ASIGNAR TÉCNICO Y COLABORADORES A UNA ORDEN
// =========================================================================
export const asignarTecnico = async (req, res) => {
    const { id } = req.params;
    const { tecnico_id, colaboradores } = req.body;

    try {
        const pool = await db();

        // 1. Actualizas el técnico principal y pasas la orden a EN_REVISION
        await pool.query(`UPDATE ordenes SET tecnico_id = ?, estado = 'EN_REVISION' WHERE id = ?`, [tecnico_id, id]);

        // 2. Limpias los colaboradores viejos (si los hubiera)
        await pool.query(`DELETE FROM ordenes_colaboradores WHERE orden_id = ?`, [id]);

        // 3. BLINDAJE: Insertas los nuevos colaboradores SOLO si existen en la BD
        if (colaboradores && Array.isArray(colaboradores)) {
            for (let colabId of colaboradores) {
                const checkColab = await pool.query(`SELECT id FROM colaboradores WHERE id = ?`, [colabId]);
                const existeColab = checkColab.recordset || (Array.isArray(checkColab[0]) ? checkColab[0] : checkColab);

                if (existeColab && existeColab.length > 0) {
                    await pool.query(
                        `INSERT INTO ordenes_colaboradores (orden_id, colaborador_id) VALUES (?, ?)`,
                        [id, colabId]
                    );
                } else {
                    console.log(`[Aviso] Se ignoró al colaborador externo ID ${colabId} porque no existe en la BD.`);
                }
            }
        }

        // 4. Le creamos la "hoja en blanco" al técnico para que le salga en su bandeja
        const checkRevision = await pool.query(`SELECT id FROM revisiones WHERE orden_id = ?`, [id]);
        const existeRev = checkRevision.recordset || (Array.isArray(checkRevision[0]) ? checkRevision[0] : checkRevision);

        if (!existeRev || existeRev.length === 0) {
            await pool.query(
                `INSERT INTO revisiones (orden_id, tecnico_id, diagnostico) VALUES (?, ?, ?)`,
                [id, tecnico_id, 'Pendiente de diagnóstico...']
            );
        } else {
            await pool.query(`UPDATE revisiones SET tecnico_id = ? WHERE orden_id = ?`, [tecnico_id, id]);
        }

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('actualizacion_taller');
        }

        res.json({ success: true, message: 'Equipo técnico asignado con éxito.' });
    } catch (error) {
        console.error("Error al asignar técnico:", error);
        res.status(500).json({ message: 'Error interno al procesar la asignación.' });
    }
};



// =========================================================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD (FOTOGRAFÍA FINANCIERA REAL + GRÁFICOS)
// =========================================================================
export const getDashboardStats = async (req, res) => {
    try {
        const pool = await db();

        // 1. Órdenes Recientes
        const resRecent = await pool.query(`
            SELECT o.id, o.motivo_ingreso, o.estado, o.monto_presupuesto as total, o.created_at, o.orden_padre_id,
                   c.nombre as cliente, v.marca, v.modelo, m.tipo as tipo_modulo
            FROM ordenes o INNER JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN vehiculos v ON o.vehiculo_id = v.id LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
            ORDER BY o.created_at DESC LIMIT 5
        `);
        const recentOrders = resRecent.recordset ? resRecent.recordset : (Array.isArray(resRecent) ? resRecent[0] : []);

        // 2. Conteo por Estados (¡PARA LA TORTA!)
        const resStatus = await pool.query(`SELECT estado, COUNT(*) as cantidad FROM ordenes GROUP BY estado`);
        const statusCounts = resStatus.recordset ? resStatus.recordset : (Array.isArray(resStatus) ? resStatus[0] : []);

        // 3. KPIs Operativos
        const resKpis = await pool.query(`
            SELECT 
                COUNT(*) as total_ordenes,
                SUM(CASE WHEN estado NOT IN ('ENTREGADO', 'CANCELADO', 'RECHAZADO') THEN 1 ELSE 0 END) as ordenes_activas,
                SUM(CASE WHEN estado IN ('TERMINADO') THEN 1 ELSE 0 END) as ordenes_listas,
                SUM(CASE WHEN vehiculo_id IS NOT NULL AND estado NOT IN ('ENTREGADO', 'CANCELADO', 'RECHAZADO') THEN 1 ELSE 0 END) as vehiculos_taller,
                SUM(CASE WHEN orden_padre_id IS NOT NULL AND estado NOT IN ('ENTREGADO', 'CANCELADO', 'RECHAZADO') THEN 1 ELSE 0 END) as garantias_activas,
                SUM(CASE WHEN orden_padre_id IS NOT NULL THEN 1 ELSE 0 END) as total_garantias_historico
            FROM ordenes
        `);
        const kpisArray = resKpis.recordset ? resKpis.recordset : (Array.isArray(resKpis) ? resKpis[0] : []);
        const kpis = kpisArray[0] || { total_ordenes: 0, ordenes_activas: 0, ordenes_listas: 0 };

        // 4. FOTOGRAFÍA CONTABLE (LA BÓVEDA UNIFICADA)
        try {
            // -- DINERO REAL EN CAJA --
            const resCaja = await pool.query(`
                SELECT 
                    SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END) as total_egresos
                FROM movimientos
            `);
            const cajaArr = resCaja.recordset ? resCaja.recordset : (Array.isArray(resCaja) ? resCaja[0] : []);
            const ingresosCaja = Number(cajaArr[0]?.total_ingresos || 0);
            const egresosCaja = Number(cajaArr[0]?.total_egresos || 0);

            // -- DINERO PROYECTADO (AQUÍ ESTÁ LA MAGIA REPARADA) --
            // 1. Ingresos que están en espera de aprobación
            const resProyIngresos = await pool.query(`
                SELECT SUM(monto_presupuesto) as ingresos_proy 
                FROM ordenes WHERE estado = 'PRESUPUESTADO'
            `);
            const proyIngresosArr = resProyIngresos.recordset ? resProyIngresos.recordset : (Array.isArray(resProyIngresos) ? resProyIngresos[0] : []);

            // 2. Costos (Egresos) que están en espera de aprobación basados en los ítems
            const resProyGastos = await pool.query(`
                SELECT SUM(d.costo_unitario * d.cantidad) as gastos_proy 
                FROM orden_detalles d INNER JOIN ordenes o ON d.orden_id = o.id 
                WHERE o.estado = 'PRESUPUESTADO'
            `);
            const proyGastosArr = resProyGastos.recordset ? resProyGastos.recordset : (Array.isArray(resProyGastos) ? resProyGastos[0] : []);

            // -- ASIGNACIÓN FINAL AL FRONTEND --
            kpis.ingresos_reales = ingresosCaja;
            kpis.gastos_reales = egresosCaja;
            kpis.ganancia_neta = ingresosCaja - egresosCaja;

            kpis.ingresos_proyectados = Number(proyIngresosArr[0]?.ingresos_proy || 0);
            kpis.gastos_proyectados = Number(proyGastosArr[0]?.gastos_proy || 0);

        } catch (err) {
            console.error("Error calculando Caja Unificada:", err);
            kpis.ingresos_reales = 0; kpis.gastos_reales = 0; kpis.ganancia_neta = 0;
            kpis.ingresos_proyectados = 0; kpis.gastos_proyectados = 0;
        }

        // 5. Top Técnicos
        const resTopTecnicos = await pool.query(`
           SELECT 
                u.nombre AS tecnico, 
                COUNT(DISTINCT o.id) AS ordenes_completadas, 
                COALESCE(SUM((d.precio_unitario - d.costo_unitario) * d.cantidad), 0) AS dinero_generado
            FROM ordenes o 
            INNER JOIN usuarios u ON o.tecnico_id = u.id
            LEFT JOIN orden_detalles d ON o.id = d.orden_id
            WHERE o.estado IN ('TERMINADO', 'ENTREGADO')
            GROUP BY u.id, u.nombre 
            ORDER BY dinero_generado DESC 
            LIMIT 5
        `);
        const topTecnicos = resTopTecnicos.recordset ? resTopTecnicos.recordset : (Array.isArray(resTopTecnicos) ? resTopTecnicos[0] : []);

        // 🚨 6. ALERTAS DE INVENTARIO (STOCK CRÍTICO) 🚨
        const resAlertasInv = await pool.query(`
            SELECT id, codigo, nombre, stock_actual, stock_minimo 
            FROM inventario 
            WHERE stock_actual <= stock_minimo AND activo = 1
            ORDER BY stock_actual ASC
            LIMIT 6
        `);
        const alertasInventario = resAlertasInv.recordset ? resAlertasInv.recordset : (Array.isArray(resAlertasInv) ? resAlertasInv[0] : []);

        // 🔥 CORRECCIÓN SENIOR: Ahora enviamos TODO, incluyendo 'alertasInventario'
        res.json({ ok: true, data: { recentOrders, statusCounts, kpis, topTecnicos, alertasInventario } });

    } catch (error) {
        console.error("Error en getDashboardStats:", error);
        res.status(500).json({ ok: false, message: 'Error obteniendo estadísticas' });
    }
};
// =========================================================================
// GENERACIÓN DE RECIBO / FACTURA (LÓGICA DE TARIFAS Y RECHAZOS INCLUIDA)
// =========================================================================
export const getOrderReceipt = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();

        const resOrder = await pool.query(`
            SELECT 
                o.id, o.estado, o.motivo_ingreso, o.created_at, o.monto_presupuesto, o.dias_garantia,
                c.nombre as cliente_nombre, c.email as cliente_email, c.telefono as cliente_telefono, c.direccion as cliente_direccion,
                v.marca, v.modelo, v.placa, v.anio, v.tipo_combustible as vehiculo_combustible,
                m.tipo as tipo_modulo, m.serial as serial_modulo, m.tipo_combustible as modulo_combustible
            FROM ordenes o
            INNER JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
            LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
            WHERE o.id = ?
        `, [id]);

        const ordenArr = resOrder.recordset || (Array.isArray(resOrder[0]) ? resOrder[0] : resOrder);
        if (!ordenArr || ordenArr.length === 0) return res.status(404).json({ message: 'Orden no encontrada' });
        const orden = ordenArr[0];

        let detalles = [];

        if (orden.estado === 'RECHAZADO') {
            const tipoEntidad = orden.vehiculo_id ? 'VEHICULO' : 'MODULO';
            const categoria = orden.vehiculo_id ? orden.vehiculo_combustible : orden.modulo_combustible;

            try {
                const resTarifa = await pool.query(
                    `SELECT precio FROM tarifas WHERE tipo_entidad = ? AND categoria = ? LIMIT 1`,
                    [tipoEntidad, categoria || 'GASOLINA']
                );
                const tarifaArr = resTarifa.recordset || (Array.isArray(resTarifa[0]) ? resTarifa[0] : resTarifa);
                const precioDiagnostico = tarifaArr.length > 0 ? Number(tarifaArr[0].precio) : 0;

                detalles = [{
                    id: 'diag',
                    tipo_item: 'MANO_OBRA',
                    descripcion: 'Servicio de Diagnóstico Técnico (Presupuesto Rechazado)',
                    cantidad: 1,
                    precio_unitario: precioDiagnostico,
                    costo_unitario: 0
                }];

                orden.monto_presupuesto = precioDiagnostico;

            } catch (err) {
                console.log("⚠️ Aviso BD (Tarifas):", err.message);
            }
        } else {
            try {
                const resDetalles = await pool.query(
                    `SELECT id, tipo_item, descripcion, cantidad, costo_unitario, precio_unitario 
                     FROM orden_detalles WHERE orden_id = ?`,
                    [id]
                );
                detalles = resDetalles.recordset || (Array.isArray(resDetalles[0]) ? resDetalles[0] : resDetalles) || [];
            } catch (err) {
                console.log("⚠️ Aviso BD (Detalles):", err.message);
            }
        }

        let diagnostico = 'No registrado';
        try {
            const resDiag = await pool.query(`SELECT diagnostico FROM revisiones WHERE orden_id = ?`, [id]);
            const diagArr = resDiag.recordset || (Array.isArray(resDiag[0]) ? resDiag[0] : resDiag);
            if (diagArr && diagArr.length > 0 && diagArr[0].diagnostico !== 'Pendiente de diagnóstico...') {
                diagnostico = diagArr[0].diagnostico;
            }
        } catch (err) {
            console.log("⚠️ Aviso BD (Revisiones):", err.message);
        }

        let reparacion = 'No registrado / Solo revisión';

        if (orden.estado === 'RECHAZADO') {
            reparacion = 'El cliente decidió no realizar la reparación. Se procede al cobro exclusivo por diagnóstico y ensamblaje del equipo.';
        } else {
            try {
                const resRep = await pool.query(`SELECT descripcion FROM reparaciones WHERE orden_id = ?`, [id]);
                const repArr = resRep.recordset || (Array.isArray(resRep[0]) ? resRep[0] : resRep);
                if (repArr && repArr.length > 0) {
                    reparacion = repArr[0].descripcion;
                }
            } catch (err) {
                console.log("⚠️ Aviso BD (Reparaciones):", err.message);
            }
        }

        res.json({
            ok: true,
            data: {
                orden,
                detalles,
                diagnostico,
                reparacion
            }
        });
    } catch (error) {
        console.error("❌ Error FATAL generando recibo:", error);
        res.status(500).json({ ok: false, message: 'Error interno al generar recibo', error: error.message });
    }
};

// =========================================================================
// GENERAR ORDEN DE GARANTÍA (ASIGNACIÓN AUTOMÁTICA)
// =========================================================================
export const crearGarantia = async (req, res) => {
    const { id } = req.params;
    const { motivo_ingreso } = req.body;

    try {
        const pool = await db();

        const resPadre = await pool.query(`
            SELECT cliente_id, vehiculo_id, modulo_id, tecnico_id 
            FROM ordenes 
            WHERE id = ?
        `, [id]);

        const padreArr = resPadre.recordset || (Array.isArray(resPadre[0]) ? resPadre[0] : resPadre);
        if (!padreArr || padreArr.length === 0) {
            return res.status(404).json({ message: 'La orden original no existe.' });
        }
        const padre = padreArr[0] || padreArr;

        const resGarantias = await pool.query(`
            SELECT COUNT(*) as total 
            FROM ordenes 
            WHERE orden_padre_id = ?
        `, [id]);

        const garantiasArr = resGarantias.recordset || (Array.isArray(resGarantias[0]) ? resGarantias[0] : resGarantias);
        const totalPrevio = garantiasArr[0]?.total || garantiasArr.total || 0;
        const indice = Number(totalPrevio) + 1;

        const motivoFinal = `[APLICA GARANTÍA #${indice}] - ${motivo_ingreso}`;

        const resInsert = await pool.query(`
            INSERT INTO ordenes 
            (cliente_id, vehiculo_id, modulo_id, estado, motivo_ingreso, monto_presupuesto, orden_padre_id, indice_garantia, tecnico_id)
            VALUES (?, ?, ?, 'EN_REPARACION', ?, 0, ?, ?, ?)
        `, [
            padre.cliente_id,
            padre.vehiculo_id,
            padre.modulo_id,
            motivoFinal,
            id,
            indice,
            padre.tecnico_id
        ]);

        const nuevaOrdenId = resInsert.insertId || resInsert[0]?.insertId || 0;

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('actualizacion_taller', { mensaje: '¡Nueva orden de garantía ingresada a tu bandeja!' });
        }

        res.status(201).json({
            ok: true,
            message: 'Orden de garantía generada y asignada con éxito.',
            data: {
                nueva_orden_id: nuevaOrdenId,
                orden_padre_id: id,
                indice_garantia: indice,
                tecnico_id: padre.tecnico_id
            }
        });

    } catch (error) {
        console.error("❌ Error generando garantía:", error);
        res.status(500).json({ message: 'Error interno al generar la garantía', error: error.message });
    }
};

// =========================================================================
// OBTENER DETALLES DE UNA ORDEN
// =========================================================================
export const getDetallesOrden = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await db();
        const resultado = await pool.query(`SELECT * FROM orden_detalles WHERE orden_id = ? ORDER BY created_at ASC`, [id]);
        const detalles = resultado.recordset || (Array.isArray(resultado[0]) ? resultado[0] : resultado);
        res.json({ success: true, data: detalles });
    } catch (error) {
        console.error("Error al obtener detalles:", error);
        res.status(500).json({ message: 'Error interno al leer el presupuesto' });
    }
};

// =========================================================================
// AGREGAR UN ÍTEM AL PRESUPUESTO (AHORA CONECTADO A INVENTARIO)
// =========================================================================
export const addDetalleOrden = async (req, res) => {
    const { id } = req.params;
    // 🔥 Añadimos inventario_id a la recepción de datos
    const { tipo_item, descripcion, cantidad, costo_unitario, precio_unitario, inventario_id } = req.body;

    if (!descripcion || precio_unitario === undefined) return res.status(400).json({ message: 'La descripción y el precio son obligatorios.' });

    try {
        const pool = await db();

        // 1. Insertamos el nuevo detalle vinculándolo al inventario
        await pool.query(
            `INSERT INTO orden_detalles (orden_id, tipo_item, descripcion, cantidad, costo_unitario, precio_unitario, inventario_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, tipo_item || 'MANO_OBRA', descripcion, cantidad || 1, costo_unitario || 0, precio_unitario, inventario_id || null]
        );

        // 2. Recalculamos el total de la orden principal
        await pool.query(`
            UPDATE ordenes 
            SET monto_presupuesto = (SELECT SUM(precio_unitario * cantidad) FROM orden_detalles WHERE orden_id = ?) 
            WHERE id = ?
        `, [id, id]);

        res.status(201).json({ success: true, message: 'Ítem agregado al presupuesto.' });
    } catch (error) {
        console.error("Error al agregar detalle:", error);
        res.status(500).json({ message: 'Error interno al agregar el ítem' });
    }
};

// =========================================================================
// BORRAR UN ÍTEM DEL PRESUPUESTO
// =========================================================================
export const deleteDetalleOrden = async (req, res) => {
    const { id, detalleId } = req.params;
    try {
        const pool = await db();

        await pool.query(`DELETE FROM orden_detalles WHERE id = ? AND orden_id = ?`, [detalleId, id]);

        await pool.query(`
            UPDATE ordenes 
            SET monto_presupuesto = COALESCE((SELECT SUM(precio_unitario * cantidad) FROM orden_detalles WHERE orden_id = ?), 0) 
            WHERE id = ?
        `, [id, id]);

        res.json({ success: true, message: 'Ítem eliminado del presupuesto.' });
    } catch (error) {
        console.error("Error al borrar detalle:", error);
        res.status(500).json({ message: 'Error interno al borrar el ítem' });
    }
};