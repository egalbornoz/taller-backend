// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia para registrar un movimiento
// -----------------------------------------------------------------------
export const dataMovement = () => {
    return `
        INSERT INTO movimientos_financieros 
        (orden_id, tipo, concepto, monto, fecha) 
        VALUES (?, ?, ?, ?, ?)
    `;
};

// -----------------------------------------------------------------------
// Funcion para obtener movimientos con detalle de la orden si existe
// -----------------------------------------------------------------------
export const movementsList = () => {
    return `
        SELECT 
            m.id, 
            m.tipo, 
            m.concepto, 
            m.monto, 
            m.fecha,
            m.orden_id,
            v.placa AS vehiculo_placa
        FROM movimientos_financieros m
        LEFT JOIN ordenes o ON m.orden_id = o.id
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        ORDER BY m.fecha DESC
    `;
};

// -----------------------------------------------------------------------
// Funcion para obtener el balance total (Ingresos - Egresos)
// -----------------------------------------------------------------------
export const financialSummaryQuery = () => {
    return `
        SELECT 
            tipo, 
            SUM(monto) as total 
        FROM movimientos_financieros 
        GROUP BY tipo
    `;
};