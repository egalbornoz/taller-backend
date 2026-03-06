import dotenv from 'dotenv';
import mysql from 'mysql2/promise'; 
import colors from "colors";

dotenv.config();

const config = {
    host: process.env.HOST, 
    user: process.env.USER_SQL_DB,
    password: process.env.PASS_SQL_DB,
    database: process.env.SQL_DB,
    waitForConnections: true,
    connectionLimit: 10, // Máximo 10 conexiones totales para TODA la app
    queueLimit: 0
};

// --- SINGLETON: Creamos el pool UNA SOLA VEZ fuera de la función ---
const pool = mysql.createPool(config);

// Interceptamos el método .query una sola vez para compatibilidad con mssql
const originalQuery = pool.query.bind(pool);
pool.query = async (...args) => {
    const [rows] = await originalQuery(...args);
    return {
        recordset: rows,
        rowsAffected: [rows?.length || 0],
        affectedRows: rows?.affectedRows || 0, // Para INSERT/UPDATE/DELETE
        insertId: rows?.insertId || null      // Para obtener el ID creado
    };
};

export const db = async () => {
    try {
        // Ya no creamos el pool aquí, solo verificamos si está vivo
        const connection = await pool.getConnection();
        connection.release(); 
        
        console.log(colors.yellow.bold('DB MySQL: Pool compartido listo.'));
        return pool;
    } catch (error) {
        console.error(colors.red.bold('Error de conexión:', error));
        throw error; 
    }
};