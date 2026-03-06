// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia para crear una orden
// -----------------------------------------------------------------------
export const dataOrder = () => {
    return `
            INSERT INTO ordenes (
                cliente_id, 
                vehiculo_id, 
                modulo_id, 
                motivo_ingreso, 
                estado, 
                asignado_por, 
                tecnico_id, 
                observaciones, 
                created_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
};

// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia para listar ordenes con detalles
// -----------------------------------------------------------------------
// src/controllers/orders.js (o donde tengas definida esta función helper)

export const ordersList = () => {
    return `
        SELECT 
            o.id, 
            o.orden_padre_id,   -- <- AGREGADO PARA GARANTÍAS
            o.indice_garantia,  -- <- AGREGADO PARA GARANTÍAS
            o.cliente_id,
            o.vehiculo_id,
            o.modulo_id,
            o.estado, 
            o.motivo_ingreso, 
            o.observaciones, 
            o.created_at,
            o.dias_garantia,    -- <- NUEVO: Días de cobertura
            o.fecha_entrega,    -- <- NUEVO: Fecha en que inició el reloj
            c.nombre AS nombre_cliente,
            v.marca,
            v.modelo,
            v.placa,
            m.tipo AS tipo_modulo,
            m.serial AS serial_modulo,
            u1.nombre AS asignado_por_nombre,
            u2.nombre AS tecnico_nombre,
            o.monto_presupuesto,
            u2.id AS tecnico_id,
            (SELECT GROUP_CONCAT(c.nombre SEPARATOR ', ') FROM ordenes_colaboradores oc INNER JOIN colaboradores c ON oc.colaborador_id = c.id WHERE oc.orden_id = o.id) AS colaboradores_nombres,
            (SELECT GROUP_CONCAT(oc.colaborador_id SEPARATOR ',') FROM ordenes_colaboradores oc WHERE oc.orden_id = o.id) AS colaboradores_ids
        FROM ordenes o
        INNER JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
        LEFT JOIN usuarios u1 ON o.asignado_por = u1.id
        LEFT JOIN usuarios u2 ON o.tecnico_id = u2.id
        ORDER BY o.created_at DESC
    `;
};
// -----------------------------------------------------------------------
// Funcion para actualizar el estado o asignacion de la orden
// -----------------------------------------------------------------------
export const updateOrderQuery = () => {
    return `
        UPDATE ordenes 
        SET estado = ?,
        tecnico_id = ?,
        observaciones = ?, 
        motivo_ingreso =?
        WHERE id = ?
    `;
};
// -----------------------------------------------------------------------
// Funcion para actualizar el estado o asignacion de la orden
// -----------------------------------------------------------------------
export const updateOrderQuery1 = () => {
    `
            UPDATE ordenes 
            SET cliente_id = ?, 
            vehiculo_id = ?, 
            modulo_id = ?, 
            estado = ?, 
            motivo_ingreso = ?, 
            observaciones = ?, 
            tecnico_id = ?, 
            monto_presupuesto = ?, 
            updated_at = NOW() 
            WHERE id = ?
        `;
};

// -----------------------------------------------------------------------
// Funcion para eliminar (o cancelar) una orden
// -----------------------------------------------------------------------
export const deleteOrderQuery = () => {
    return `
        DELETE FROM ordenes 
        WHERE id = ?
    `;
};
// -----------------------------------------------------------------------
// Consulta de órdenes filtradas por estado
// -----------------------------------------------------------------------
export const ordersByStatusQuery = () => {
    return `
        SELECT o.*, c.nombre AS cliente_nombre, v.placa AS vehiculo_placa
        FROM ordenes o
        INNER JOIN clientes c ON o.cliente_id = c.id
        INNER JOIN vehiculos v ON o.vehiculo_id = v.id
        WHERE o.estado = ?
        ORDER BY o.created_at DESC
    `;
};

// -----------------------------------------------------------------------
// Consulta de órdenes filtradas por técnico asignado
// -----------------------------------------------------------------------
export const ordersByTechnicianQuery = () => {
    return `
    SELECT o.*, c.nombre AS cliente_nombre, v.placa AS vehiculo_placa, m.serial AS modulo_serial
    FROM ordenes o
    INNER JOIN clientes c ON o.cliente_id = c.id
        INNER JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN modulos_ecu m ON o.modulo_id = m.id
        WHERE o.tecnico_id = ?
        ORDER BY o.estado ASC, o.created_at DESC
    `;
};
// -----------------------------------------------------------------------
// Asignacion a un tecnico
// -----------------------------------------------------------------------
export const orderSigTechnical = () => {
    return ` UPDATE ordenes 
            SET tecnico_id = ?, 
                asignado_por = ?, 
                estado = 'EN_REVISION',
                updated_at = NOW()
            WHERE id = ?
        `;
}