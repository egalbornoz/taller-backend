

// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia SQL para buscar usuario y rol
// -----------------------------------------------------------------------
export const authUser = () => {
    return `
        SELECT 
            u.id, 
            u.nombre, 
            u.email, 
            u.password_hash,  -- IMPORTANTE: Necesario para validar el login
            u.activo, 
            u.created_at,
            r.nombre as nombre_rol,
            r.id as rol_id
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE u.email = ?
    `;
}