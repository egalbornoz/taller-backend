export const updateVehicleQuery = () => {
    return `
        UPDATE vehiculos 
        SET cliente_id = ?, marca = ?, modelo = ?, anio = ?, placa = ?, vin = ?, img_documento = ?, tipo_combustible = ?
        WHERE id = ?
    `;
};
export const dataVehicle = () => {
    return `
        INSERT INTO vehiculos 
        (cliente_id, marca, modelo, anio, placa, vin, img_documento, tipo_combustible, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
};

export const vehiclesList = () => {
    return `
        SELECT 
            v.id, v.cliente_id, c.nombre as nombre_cliente,
            v.marca, v.modelo, v.anio, v.placa, v.vin, v.img_documento, v.tipo_combustible, v.created_at
        FROM vehiculos v
        INNER JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.created_at DESC
    `;
};


export const deleteVehicleQuery = () => {
    return `DELETE FROM vehiculos WHERE id = ?`;
};