import { db } from '../database/config.js';

export const generateFinalAuditData = async (inicio, fin, filtros) => {
    const pool = await db();
    
    // Limpieza de fechas para evitar problemas de zona horaria
    const fechaInicio = inicio.split('T')[0];
    const fechaFin = fin.split('T')[0];

    // Filtro base: Usamos DATE() para ignorar horas en created_at
    let whereClause = `WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ? `;
    const queryParams = [fechaInicio, fechaFin];

    if (filtros.estado) {
        whereClause += ` AND o.estado = ?`;
        queryParams.push(filtros.estado);
    }

    try {
        // 1. SQL DE MÉTRICAS: COALESCE asegura que si no hay datos, devuelva 0 y no NULL
        const sqlMetricas = `
            SELECT 
                COUNT(o.id) as total_ordenes,
                COALESCE(SUM(o.monto_presupuesto), 0) as monto_total_cotizado, 
                COALESCE(SUM(IF(o.estado = 'ENTREGADO', o.monto_presupuesto, 0)), 0) as monto_total_recaudado,
                COUNT(IF(o.estado = 'ENTREGADO', 1, NULL)) as ordenes_finalizadas,
                COUNT(IF(o.indice_garantia > 0, 1, NULL)) as total_garantias
            FROM ordenes o
            ${whereClause}
        `;
        
        const resultMetricas = await pool.query(sqlMetricas, queryParams);
        
        // DEFENSA SENIOR: Si no hay filas, inicializamos con ceros para evitar el error de 'undefined'
        const m = (resultMetricas && resultMetricas.length > 0) 
            ? resultMetricas[0] 
            : { total_ordenes: 0, monto_total_cotizado: 0, monto_total_recaudado: 0, ordenes_finalizadas: 0, total_garantias: 0 };

        // 2. SQL DE DETALLES: Cruce con Clientes, Vehículos y Módulos ECU
        let sqlDetalles = `
            SELECT 
                o.id AS orden_id, 
                o.estado, 
                o.created_at AS fecha_apertura,
                o.monto_presupuesto AS total_cotizado,
                IF(o.estado = 'ENTREGADO', o.monto_presupuesto, 0.00) AS total_recaudado,
                o.indice_garantia,
                COALESCE(c.nombre, 'Sin Cliente') AS cliente,
                COALESCE(v.placa, ecu.serial) AS identificador_equipo,
                COALESCE(v.marca, ecu.marca) AS marca_equipo
            FROM ordenes o
            LEFT JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
            LEFT JOIN modulos_ecu ecu ON o.modulo_id = ecu.id
            ${whereClause} 
            ORDER BY o.created_at DESC
        `;

        const detallesRows = await pool.query(sqlDetalles, queryParams);
console.log(detallesRows)
        // 3. CÁLCULO DE EFICIENCIA (Anti-NaN)
        const montoCotizado = Number(m.monto_total_cotizado) || 0;
        const montoRecaudado = Number(m.monto_total_recaudado) || 0;
        let eficienciaStr = "0.00%";
        
        if (montoCotizado > 0) {
            eficienciaStr = ((montoRecaudado / montoCotizado) * 100).toFixed(2) + "%";
        }

        return {
            success: true,
            metricas: {
                total_ordenes: Number(m.total_ordenes) || 0,
                monto_total_cotizado: montoCotizado,
                monto_total_recaudado: montoRecaudado,
                ordenes_finalizadas: Number(m.ordenes_finalizadas) || 0,
                total_garantias: Number(m.total_garantias) || 0,
                eficiencia_cobro: eficienciaStr
            },
            detalles: detallesRows || []
        };

    } catch (error) {
        console.error(">> ERROR EN AUDITORÍA:", error.message);
        throw error;
    }
};