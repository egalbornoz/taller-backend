import { validationResult } from 'express-validator';

// ----------------------------------------------------------------
//   Middleware para validar campos
// ----------------------------------------------------------------

export const validField = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            // Devuelve el primer error encontrado para ser más limpio
            message: errors.errors[0].msg, 
            errors: errors.array() // Opcional: si quieres ver todos los detalles
        });
    }
    next();
}