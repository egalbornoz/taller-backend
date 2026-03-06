// -----------------------------------------------------------------------
// Sentencia para registrar una notificación en la cola
// -----------------------------------------------------------------------
export const dataNotification = () => {
    return `
        INSERT INTO notificaciones 
        (orden_id, canal, destino, mensaje, enviado, fecha) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
};

// -----------------------------------------------------------------------
// Consulta de notificaciones pendientes de envío
// -----------------------------------------------------------------------
export const pendingNotifications = () => {
    return `
        SELECT n.*, c.nombre as cliente_nombre 
        FROM notificaciones n
        LEFT JOIN ordenes o ON n.orden_id = o.id
        LEFT JOIN clientes c ON o.cliente_id = c.id
        WHERE n.enviado = 0
        ORDER BY n.fecha ASC
    `;
};

// -----------------------------------------------------------------------
// Actualizar estado de envío
// -----------------------------------------------------------------------
export const markAsSentQuery = () => {
    return `
        UPDATE notificaciones 
        SET enviado = 1 
        WHERE id = ?
    `;
};