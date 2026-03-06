import { db } from "../database/config.js";

// -------------------------------------------------------------
//    Metodo para validar si el email existe (Para Login)
// -------------------------------------------------------------
export const userExistForEmail = async (email = '') => {

    if (!email) throw new Error('El correo es obligatorio');

    const pool = await db();

    try {
        // Usamos pool.query directamente (tu adaptador lo intercepta)
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        // Leemos .recordset porque tu adaptador lo devuelve así
        const rows = resultado.recordset;

        if (rows.length === 0) {
            throw new Error(`El correo ${email} no está registrado`);
        }
        return true;

    } catch (error) {
        throw error; 
    }
}

// -------------------------------------------------------------
//    Metodo para validar si el email YA existe (Para Registro)
// -------------------------------------------------------------
export const searhEmail = async (email = '') => {
    const pool = await db();
    try {
        // CORREGIDO: Quitamos .request() y usamos sintaxis segura '?'
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        const rows = resultado.recordset;

        if (rows.length > 0) {
            throw new Error(`Email ${email} ya se encuentra registrado`);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// -------------------------------------------------------------
//    Metodo para validar ID de usuario
// -------------------------------------------------------------
export const existUserId = async (id = '') => {
    const pool = await db();
    try {
        // CORREGIDO: Quitamos .request() y usamos sintaxis segura '?'
        const resultado = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        const rows = resultado.recordset;

        if (rows.length === 0) {
            throw new Error(`Usuario con ID ${id} no existe`);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// -------------------------------------------------------------
//    Funcion auxiliar simple
// -------------------------------------------------------------
export const isArrayNotEmpty = (arr) => {
    return Array.isArray(arr) && arr.length > 0;
}