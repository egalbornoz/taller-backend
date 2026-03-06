import jwt from 'jsonwebtoken';
//-------------------------------------------------------------
//    Metodo para generar JWT del usuario loggeado
//-------------------------------------------------------------
export const generarJWT = (uid = '') => {
    return new Promise((resolve, reject) => {

        const payload = { uid };
        jwt.sign(payload, process.env.SECRET_JWT,{
            expiresIn: '99999999999999d'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        })
    });

};