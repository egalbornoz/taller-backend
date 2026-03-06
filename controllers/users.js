import { response } from "express";
import bcrypt from 'bcryptjs';
import { db } from '../database/config.js';
import { activeTechniciansList, dataUser, delUser, user_get, usersByRoleSQL, usersList, userUpdate } from "../models/users.js";

// ------------------------------------------------------------------------------
//   Metodo para obtener un usuario por su ID con su ROL
// ------------------------------------------------------------------------------

export const getUser = async (req, res) => {
    const sql = user_get();
    const { id } = req.params;

    try {
        const pool = await db();

        const resultado = await pool.query(sql, [id]);
        const rows = resultado.recordset;
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }
        // Devolvemos el primer objeto encontrado
        res.status(200).json({
            success: true,
            message: 'Información del usuario recuperada',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}


// ------------------------------------------------------------------------------
//   Metodo para eliminar un usuarios
// ------------------------------------------------------------------------------
export const deleteUser = async (req = require, res = response) => {
    const { id } = req.params;
    const sqlGet = user_get();
    // Establecemos la conexion
    try {
        const pool = await db();
        const resultado = await pool.query(sqlGet, [id]);


        // Accedemos a .recordset gracias a tu adaptador
        const usuarioActual = resultado.recordset[0];

        if (!usuarioActual) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        const activo = 0;
        const values = [activo, id];
        const sql = delUser();
        console.log(values);

        // 6. Ejecutar actualización
        await pool.query(sql, values);

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado ...',
        });

    } catch (error) {
        console.error('Error al intentar actualizar el usuario', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// ------------------------------------------------------------------------------
//   Metodo para buscar usuarios por su ROL
// ------------------------------------------------------------------------------
export const getUsersByRole = async (req, res) => {

    // Recibimos el rol por la URL (ej: /api/users/role/ADMIN)
    const { rol } = req.params;

    try {
        const pool = await db();

        // Obtenemos la sentencia SQL
        const sql = usersByRoleSQL();

        // Ejecutamos la consulta pasando el parametro de forma segura
        const resultado = await pool.query(sql, [rol]);

        // Accedemos a .recordset (gracias a tu adaptador)
        const usuarios = resultado.recordset;

        // Validamos si se encontraron resultados
        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No se encontraron usuarios activos con el rol: ${rol}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuarios encontrados',
            data: usuarios
        });

    } catch (error) {
        console.error('Error al buscar usuarios por rol', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// src/controllers/users.js
import {
    queryAllUsers, queryAllRoles, queryUserByEmail,
    insertUser, updateUserQuery, updatePasswordQuery, toggleUserStatusQuery
} from '../models/users.js';

export const getUsers = async (req, res) => {
    try {
        const pool = await db();
        const result = await pool.query(queryAllUsers());
        res.json({ success: true, data: result.recordset || result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

export const getRoles = async (req, res) => {
    try {
        const pool = await db();
        const result = await pool.query(queryAllRoles());
        res.json({ success: true, data: result.recordset || result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener roles' });
    }
};

export const createUser = async (req, res) => {
    const { nombre, email, telefono, password, rol_id } = req.body;
    try {
        const pool = await db();

        // 1. Verificar si el email ya existe
        const existingUser = await pool.query(queryUserByEmail(), [email]);
        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // 2. Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // 3. Guardar usuario
        await pool.query(insertUser(), [nombre, email, telefono, hash, rol_id]);

        res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, password, rol_id } = req.body;

    try {
        const pool = await db();

        // 1. Verificar si el email está en uso por OTRO usuario
        const existing = await pool.query(`SELECT id FROM usuarios WHERE email = ? AND id != ?`, [email, id]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
        }
   

        // 2. Actualizar datos básicos
        const abc = await pool.query(updateUserQuery(), [nombre, email, telefono, rol_id, id]);

        // 3. Actualizar contraseña SOLO si se envió una nueva
        if (password && password.trim() !== '') {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            await pool.query(updatePasswordQuery(), [hash, id]);
        }

        res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

export const toggleStatus = async (req, res) => {
    const { id } = req.params;

    // Validación de seguridad: Un administrador no puede desactivarse a sí mismo
    if (String(req.usuario.id) === String(id)) {
        return res.status(403).json({ message: 'No puedes desactivar tu propia cuenta' });
    }

    try {
        const pool = await db();
        await pool.query(toggleUserStatusQuery(), [id]);
        res.json({ success: true, message: 'Estado del usuario modificado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar estado del usuario' });
    }
};
export const getActiveTechnicians = async (req, res) => {
    try {
        const pool = await db();
        const sql = activeTechniciansList(); // La importas del modelo
        const result = await pool.query(sql);

        // Devolvemos la data lista
        res.json({ success: true, data: result.recordset || result });
    } catch (error) {
        console.error('Error al obtener técnicos:', error);
        res.status(500).json({ message: 'Error al cargar lista de técnicos' });
    }
};

// =========================================================================
// CAMBIAR MI PROPIA CONTRASEÑA (Desde el Perfil)
// =========================================================================
export const cambiarMiPassword = async (req, res) => {
    // Extraemos el ID directamente del Token (Nadie puede cambiar el ID por URL)
    const userId = req.usuario.id; 
   
    const { passwordActual, nuevaPassword } = req.body;

    try {
        const pool = await db();
        
        // 1. Buscamos al usuario y su contraseña encriptada actual
        const resUser = await pool.query(`SELECT password_hash FROM usuarios WHERE id = ?`, [userId]);
        const userArr = resUser.recordset || (Array.isArray(resUser[0]) ? resUser[0] : resUser);
       
        if (!userArr || userArr.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado en la base de datos.' });
        }
        
        const passwordDB = userArr[0].password_hash;

        // 2. Verificamos que la contraseña actual ingresada coincida con la de la BD
        const passwordValida = await bcrypt.compare(passwordActual, passwordDB);
        if (!passwordValida) {
            return res.status(400).json({ message: 'La contraseña actual ingresada es incorrecta.' });
        }
        // 3. Encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashNuevo = await bcrypt.hash(nuevaPassword, salt);

        // 4. Guardamos la nueva contraseña
        await pool.query(`UPDATE usuarios SET password_hash = ?, updated_at = NOW() WHERE id = ?`, [hashNuevo, userId]);

        res.json({ success: true, message: 'Tu contraseña ha sido actualizada con éxito.' });

    } catch (error) {
        console.error('🔥 Error al cambiar password:', error);
        res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña' });
    }
};