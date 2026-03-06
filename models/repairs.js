// -----------------------------------------------------------------------
// Sentencia para crear una reparación
// -----------------------------------------------------------------------
export const dataReparacion = () => {
    return `
        INSERT INTO reparaciones (orden_id, tecnico_id, descripcion, costo_reparacion, fecha, video_reparacion) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
};
// -----------------------------------------------------------------------
// Sentencia para actualizar una reparación
// -----------------------------------------------------------------------
export const updtRepair = () => {
    return `
        UPDATE reparaciones 
        SET descripcion = ?, costo_reparacion = ?, video_reparacion = COALESCE(?, video_reparacion) 
        WHERE id = ?
    `;
};
// -----------------------------------------------------------------------
// Consulta de reparaciones por ID de Orden
// -----------------------------------------------------------------------
export const reparacionListByOrder = () => {
    return `
        SELECT rep.*, u.nombre as tecnico_nombre 
        FROM reparaciones rep
        INNER JOIN usuarios u ON rep.tecnico_id = u.id
        WHERE rep.orden_id = ?
        ORDER BY rep.fecha DESC
    `;
};
// -----------------------------------------------------------------------
// Consultas de lectura (Se añade r.video_reparacion)
// -----------------------------------------------------------------------
export const reparacionListByTechnician = () => {
    return `
        SELECT r.id, r.descripcion, r.costo_reparacion, r.fecha, r.video_reparacion,
               o.id AS orden_id, o.vehiculo_id, o.modulo_id, u.nombre AS tecnico_nombre,
               c.nombre AS cliente_nombre, v.placa, v.marca, v.modelo, m.tipo AS tipo_modulo, m.serial AS serial_modulo
        FROM reparaciones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
        WHERE r.tecnico_id = ? ORDER BY r.fecha DESC
    `;
};
export const reparacionByDateRange = () => {
    return `
        SELECT r.id, r.descripcion, r.costo_reparacion, r.fecha, r.video_reparacion,
               o.id AS orden_id, u.nombre AS tecnico_nombre, c.nombre AS cliente_nombre, v.placa AS vehiculo_placa
        FROM reparaciones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
        WHERE DATE(r.fecha) BETWEEN ? AND ? ORDER BY r.fecha ASC
    `;
};
// -----------------------------------------------------------------------
// Consulta General de TODAS las reparaciones (Para la tabla principal)
// -----------------------------------------------------------------------
export const allRepairsList = () => {
    return `
        SELECT r.id, r.descripcion, r.costo_reparacion, r.fecha, r.video_reparacion,
               o.id AS orden_id, o.vehiculo_id, o.modulo_id, u.nombre AS tecnico_nombre,
               c.nombre AS cliente_nombre, v.placa, v.marca, v.modelo, m.tipo AS tipo_modulo, m.serial AS serial_modulo
        FROM reparaciones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
        ORDER BY r.fecha DESC
    `;
};
// Obtener datos cruzados para generar la garantía
export const repairDetailsForWarranty = () => {
    return `
        SELECT r.tecnico_id, r.descripcion, o.cliente_id, o.vehiculo_id, o.modulo_id
        FROM reparaciones r
        INNER JOIN ordenes o ON r.orden_id = o.id
        WHERE r.id = ?
    `;
};