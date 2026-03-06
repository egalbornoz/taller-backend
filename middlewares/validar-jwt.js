import { response, request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/config.js';

export const validarJWT = async (req = request, res = response, next) => {
    // 1. Leer el token de los headers
    // const token = req.header('token');
    let token = req.header('Authorization') || req.headers.authorization;
    // NIVEL 1: Validación de Existencia
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay token en la petición'
        });
    }
    // NIVEL 2: Validación de Formato (Estructural)
    // Un JWT siempre tiene 3 partes separadas por puntos: Header.Payload.Signature
    const parts = token.split('.');
    if (parts.length !== 3) {
        return res.status(400).json({
            success: false,
            message: 'El  token no es válido (**********)'
        });
    }

    try {
        // --- 2. LA SOLUCIÓN: LIMPIAR EL PREFIJO ---
        // Si el token empieza con "JWT " o "Bearer ", lo cortamos
        if (token.startsWith('JWT ')) {
            token = token.slice(4); // Corta los primeros 4 caracteres ("JWT ")
        } else if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1]; // Lo separa por el espacio y toma la segunda parte
        }
        const { uid } = jwt.verify(token, process.env.SECRET_JWT);
        // NIVEL 4: Validación de Base de Datos
        const pool = await db();

        // Buscamos usuario y rol (necesario para tu middleware de roles)
        const sql = `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.activo, 
                u.rol_id, 
                r.nombre as rol 
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.id = ?
        `;

        const resultado = await pool.query(sql, [uid]);
        const rows = resultado.recordset; // Tu adaptador
        const usuario = rows[0];
        // 4.1 Si el usuario no existe en la BD
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token no válido - usuario no existe en DB'
            });
        }

        // 4.2 Si el usuario fue borrado o desactivado
        if (!usuario.activo || usuario.activo == 0) {
            return res.status(401).json({
                success: false,
                message: 'Token no válido - usuario inactivo'
            });
        }

        // Si todo pasa, inyectamos el usuario en la request
        req.usuario= usuario;

        console.log(`[Auth] Token validado para usuario: ${usuario.email}`);
        next();

    } catch (error) {
        console.log('[Auth Error]:', error.message);

        // MANEJO DE ERRORES ESPECÍFICOS DE JWT

        // 1. El token ya caducó (pasó su tiempo de vida)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El token ha expirado, por favor inicie sesión nuevamente'
            });
        }

        // 2. La firma no coincide (alguien intentó modificar el token)
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido (Firma no reconocida)'
            });
        }

        // 3. Error genérico
        res.status(401).json({
            success: false,
            message: 'Token no válido'
        });
    }
}