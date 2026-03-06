// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para actualizar un clientes
// -----------------------------------------------------------------------
export const updateClientQuery = () => {
    return `
        UPDATE clientes 
        SET nombre = ?, telefono = ?, email = ?, direccion = ?, updated_at = ?
        WHERE id = ?
    `;
};
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la consulta de lista de clientes
// -----------------------------------------------------------------------

export const clientsList = () => {
    return `
            SELECT 
            id, 
            nombre, 
            telefono, 
            email, 
            direccion,
            created_at,
            updated_at
            FROM clientes
            WHERE activo = ?
           `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la crear un cliente
// -----------------------------------------------------------------------
export const dataClient = () => {
    return `
            INSERT INTO  clientes 
            (
                nombre, 
                telefono, 
                email, 
                direccion,
                activo,
                updated_at,
                created_at
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia eliminar/desactivar un cliente
// -----------------------------------------------------------------------
// ... (Tus otras queries)

export const deleteClientQuery = () => {
    return `
        UPDATE clientes 
        SET activo = 0,
        updated_at = ?
        WHERE id = ?
    `;
};