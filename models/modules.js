export const dataModule = () => {
    return `
        INSERT INTO modulos_ecu 
        (cliente_id, tipo, marca, modelo, numero_parte, serial, observaciones, img_documento, tipo_combustible, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
};


export const updateModuleQuery = () => {
    return `
    UPDATE modulos_ecu 
    SET cliente_id = ?, tipo = ?, marca = ?, modelo = ?, numero_parte = ?, serial = ?, observaciones = ?, img_documento = ?, tipo_combustible = ?
    WHERE id = ?
    `;
};

export const modulesList = () => {
    return `
        SELECT m.*, c.nombre as nombre_cliente 
        FROM modulos_ecu m 
        INNER JOIN clientes c ON m.cliente_id = c.id 
        ORDER BY m.created_at DESC
    `;
};
export const deleteModuleQuery = () => {
    return `DELETE FROM modulos_ecu WHERE id = ?`;
};