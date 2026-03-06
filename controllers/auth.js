import bcrypt from 'bcryptjs'; // Asegúrate de tener esto instalado
import { generarJWT } from "../helpers/genara-jwt.js";
import { db } from '../database/config.js';
import { authUser } from '../models/auth.js';

export const login = async (req, res) => {
// 1. Llamas a la función para obtener el string SQL
const sql = authUser();
    const { email, password_hash } = req.body;

    try {
        const pool = await db();
        const resultado = await pool.query(sql,[email]);
        const rows = resultado.recordset;
        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y/o contraseña no son válidos'
            });
        }

        const usuario = rows[0]; // Tomamos el primer usuario
        if (!usuario.activo || usuario.activo == 0) {
            return res.status(400).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }
        const validarPass = bcrypt.compareSync(password_hash, usuario.password_hash);

        if (!validarPass) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y/o contraseña no son válidos'
            });
        }
        const token = await generarJWT(usuario.id);

        const dataUser = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            activo: usuario.activo,
            rol_id:usuario.rol_id,
            nombre_rol:usuario.nombre_rol,
            create_at: usuario.create_at,
            sessiontoken: `JWT ${token}`,
        };

        console.log('Login exitoso:', dataUser.email);

        res.status(200).json({
            success: true,
            message: 'Usuario autenticado',
            data: dataUser
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};