// -----------------------------------------------------------------------
// Sentencia para el reporte de auditoría completa por Orden
// -----------------------------------------------------------------------
export const finalAuditReportQuery = () => {
    return `
        SELECT 
    o.id AS orden_id,
    o.estado,
    o.created_at AS fecha_apertura,
    c.nombre AS cliente,
    -- Detectamos si es Vehículo o Módulo para la columna de equipo
    COALESCE(v.placa, m.serial) AS identificador_equipo,
    COALESCE(v.marca, m.marca) AS marca_equipo,
    
    -- El dinero real de Edwin está en monto_presupuesto
    o.monto_presupuesto AS total_cotizado,
    
    -- Solo contamos como recaudado si el equipo fue ENTREGADO
    IF(o.estado = 'ENTREGADO', o.monto_presupuesto, 0.00) AS total_recaudado,
    
    -- Etiqueta de Garantía
    CASE 
        WHEN o.indice_garantia > 0 THEN 'SÍ' 
        ELSE 'NO' 
    END AS es_garantia
FROM ordenes o
INNER JOIN clientes c ON o.cliente_id = c.id
-- Usamos LEFT JOIN para que las órdenes de Módulos NO desaparezcan
LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
WHERE 
    -- Corregimos el error del '025' y usamos DATE para ignorar horas
    DATE(o.created_at) BETWEEN '2026-02-25' AND '2026-03-05'
ORDER BY o.created_at DESC;
    `;
};
