// -----------------------------------------------------------------------
// Sentencia para crear una revisión técnica
// -----------------------------------------------------------------------
export const dataRevision = () => {
    return `
        INSERT INTO revisiones (orden_id, tecnico_id, diagnostico, video_diagnostico, costo_revision, fecha) 
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
};

// -----------------------------------------------------------------------
// Consulta de revisiones por ID de Orden
// -----------------------------------------------------------------------
export const revisionListByOrder = () => {
    return `
        SELECT 
            r.*, 
            u.nombre as tecnico_nombre,
            o.estado as estado_orden
        FROM revisiones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        WHERE r.orden_id = ?
        ORDER BY r.fecha DESC
    `;
};

// -----------------------------------------------------------------------
// Sentencia para actualizar el diagnóstico de una revisión
// -----------------------------------------------------------------------
export const updateRevisionQuery = () => {
    return `
        UPDATE revisiones 
        SET diagnostico = ?, video_diagnostico = ?, costo_revision = ?
        WHERE id = ?
    `;
};

// -----------------------------------------------------------------------
// Sentencia para listar todas las revisiones
// -----------------------------------------------------------------------
export const allRevisionsList = () => {
    return `
        SELECT 
            r.*, 
            u.nombre as tecnico_nombre, 
            o.estado as estado_orden, 
            c.nombre as cliente_nombre
        FROM revisiones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        ORDER BY r.fecha DESC
    `;
};

// -----------------------------------------------------------------------
// Consulta de revisiones por rango de fechas (Reportes)
// -----------------------------------------------------------------------
export const revisionByDateRange = () => {
    return `
        SELECT 
            r.id, 
            r.diagnostico,
            r.video_diagnostico, -- <-- ¡AGREGADO!
            r.costo_revision, 
            r.fecha,
            o.id AS orden_id,
            o.estado AS estado_orden,
            u.nombre AS tecnico_nombre,
            c.nombre AS cliente_nombre
        FROM revisiones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        WHERE DATE(r.fecha) BETWEEN ? AND ?
        ORDER BY r.fecha ASC
    `;
};

// -----------------------------------------------------------------------
// Consulta General de revisiones filtrada por UN SOLO TÉCNICO
// -----------------------------------------------------------------------
export const allRevisionsListByTecnico = () => {
    return `
        SELECT 
            r.id, 
            r.diagnostico,
            r.video_diagnostico, -- <-- ¡AGREGADO!
            r.costo_revision, 
            r.fecha,
            o.id AS orden_id,
            o.estado AS estado_orden,
            u.nombre AS tecnico_nombre,
            c.nombre AS cliente_nombre
        FROM revisiones r
        INNER JOIN usuarios u ON r.tecnico_id = u.id
        INNER JOIN ordenes o ON r.orden_id = o.id
        INNER JOIN clientes c ON o.cliente_id = c.id
        WHERE r.tecnico_id = ?  -- FILTRO ESTRICTO APLICADO AQUÍ
        ORDER BY r.fecha DESC
    `;
};