export const queryAllCollaborators = () => {
    return `SELECT * FROM colaboradores WHERE activo = 1 ORDER BY nombre ASC`;
};

export const insertCollaborator = () => {
    return `INSERT INTO colaboradores (nombre, especialidad, telefono) VALUES (?, ?, ?)`;
};