import { response, request } from 'express';

export const tieneRol = (...rolesPermitidos) => {
    return (req = request, res = response, next) => {
        // 1. Verificación de seguridad: Si no se validó el token antes, esto falla.
        if (!req.usuario) {
            return res.status(500).json({
                msg: 'Se quiere verificar el role sin validar el token primero'
            });
        }

        // 2. Verificamos si el rol del usuario está incluido en los permitidos
        // NOTA: Asegúrate que tu validación de JWT guarde el rol en 'req.user.rol'
        // o cambia esto a 'req.user.rol_id' si usas IDs.
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                // msg: `El servicio requiere uno de estos roles: ${rolesPermitidos}`
                msg: 'Usuario no AUTORIZADO!'
            });
        }

        next();
    };
};