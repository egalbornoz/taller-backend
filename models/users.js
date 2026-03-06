// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la consulta de lista de usuarios
// -----------------------------------------------------------------------

export const usersList = () => {
    return `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.telefono,
                u.activo, 
                u.created_at,
                u.updated_at,
                r.nombre as nombre_rol,
                r.id as rol_id
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.activo=1
    `;
}
// -----------------------------------------------------------------------
// Funcion que devuelve la sentencia SQL para buscar usuario y rol
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la consulta de un usuario
// -----------------------------------------------------------------------
export const user_get = (email = '') => {
    return `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.telefono,
                u.activo, 
                u.created_at,
                u.updated_at,
                r.nombre as nombre_rol,
                r.id as rol_id
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.id = ?
        `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la crear un usuario
// -----------------------------------------------------------------------
export const dataUser = () => {
    return `
            INSERT INTO usuarios 
            (
                nombre, 
                email, 
                telefono,
                password_hash, 
                rol_id, 
                activo, 
                updated_at,
                created_at
                ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la actualizar un usuario
// -----------------------------------------------------------------------
export const userUpdate = () => {
    return `
        UPDATE usuarios
        SET nombre = ?,
            telefono = ?,
            rol_id = ?,
            password_hash = ?, 
            activo = ?
        WHERE id = ?
    `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte la sentencia para la eliminar (actualizar estatus activo false) un usuario
// -----------------------------------------------------------------------
export const delUser = () => {
    return `UPDATE usuarios
                        SET    activo = ?
                        WHERE  id = ?`;
}
// -----------------------------------------------------------------------
//  Sentencia para buscar usuarios por Nombre de Rol (ej: 'ADMIN')
// -----------------------------------------------------------------------
export const usersByRoleSQL = () => {
    return `
        SELECT 
            u.id, 
            u.nombre, 
            u.telefono,
            u.email, 
            u.telefono,
            u.activo, 
            r.nombre as rol
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE r.nombre = ? AND u.activo = 1
    `;
}
// -----------------------------------------------------------------------
// Funcion que devuelte si un correo existe
// -----------------------------------------------------------------------
// export const email = (correo) => {
//     const emailExist = `SELECT *FROM usuarioweb WHERE correo=${correo}`;
//     return emailExist;
// }
// src/models/users.js

export const queryAllUsers = () => {
    return `
        SELECT u.id, u.nombre, u.email, u.telefono, u.activo, u.rol_id, r.nombre as nombre_rol  
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        ORDER BY u.created_at DESC
    `;
};

export const queryAllRoles = () => {
    return `SELECT id, nombre FROM roles ORDER BY id ASC`;
};

export const queryUserByEmail = () => {
    return `SELECT id FROM usuarios WHERE email = ?`;
};

export const insertUser = () => {
    return `
        INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_id, activo, created_at) 
        VALUES (?, ?, ?, ?, ?, 1, NOW())
    `;
};

export const updateUserQuery = () => {
    return `
        UPDATE usuarios 
        SET nombre = ?, email = ?, telefono = ?, rol_id = ?, updated_at = NOW() 
        WHERE id = ?
    `;
};

export const updatePasswordQuery = () => {
    return `
        UPDATE usuarios 
        SET password_hash = ?, updated_at = NOW() 
        WHERE id = ?
    `;
};

export const toggleUserStatusQuery = () => {
    return `
        UPDATE usuarios 
        SET activo = NOT activo, updated_at = NOW() 
        WHERE id = ?
    `;
};
export const activeTechniciansList = () => {
    return `
        SELECT u.id, u.nombre, r.nombre as nombre_rol 
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE u.activo = 1 AND (r.nombre = 'TECNICO' OR u.rol_id = 3)
    `;
}