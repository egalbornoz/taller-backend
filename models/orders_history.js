// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia para registrar un cambio de estado
// -----------------------------------------------------------------------
export const dataHistory = () => {
    return `
        INSERT INTO orden_estado_historial 
        (orden_id, estado, cambiado_por, fecha) 
        VALUES (?, ?, ?, ?)
    `;
};

// -----------------------------------------------------------------------
// Funcion que devuelve la linea de tiempo de una orden especifica
// -----------------------------------------------------------------------
export const historyByOrder = () => {
    return `
        SELECT 
            h.id, 
            h.estado, 
            h.fecha, 
            u.nombre AS usuario_nombre
        FROM orden_estado_historial h
        INNER JOIN usuarios u ON h.cambiado_por = u.id
        WHERE h.orden_id = ?
        ORDER BY h.fecha DESC
    `;
};