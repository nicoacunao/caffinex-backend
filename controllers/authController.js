const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        userName,
        birthDate,
        gender,
        country
    } = req.body;

    const connection = await db.getConnection();

    try {

        // Se inicia una transacción para asegurar que todas las operaciones se completen correctamente
        await connection.beginTransaction();

        // Verificar si el usuario ya existe
        const [existingUsers] = await connection.query(
            'SELECT userId, email FROM User WHERE email = ?',
            [email]
        );

        // Si el usuario ya existe, se hace rollback de la transacción y se retorna un error
        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'El usuario ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const [userResult] = await connection.query(
            `
            INSERT INTO User 
                (email, password, firstName, lastName, userName, birthDate, gender, country) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [email, hashedPassword, firstName, lastName, userName, birthDate, gender, country]
        );

        // Obtener el id del nuevo usuario
        const userId = userResult.insertId;

        // Se obtiene la info de las listas por defecto (Want To Try, Bought, Tried) y se crean las listas para el nuevo usuario
        const [defaultLists] = await connection.query(
            `
            SELECT listInfoId
            FROM ListInfo
            WHERE listOrder IN (1, 2, 3)
            ORDER BY listOrder ASC
            `
        );

        // Se crean las listas para el nuevo usuario
        for (const listInfo of defaultLists) {
            await connection.query(
                `
                INSERT INTO List (userId, listInfoId)
                VALUES (?, ?)
                `,
                [userId, listInfo.listInfoId]
            );
        }

        // Si todo es correcto, se hace commit de la transacción
        await connection.commit();

        // Se retorna el id del nuevo usuario
        return res.status(201).json({
            message: 'Usuario creado',
            userId
        });

    } catch (error) {
        // En caso de error, se hace rollback de la transacción para evitar datos inconsistentes
        await connection.rollback();

        // Se retorna un error genérico con detalles del error para facilitar el debugging
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });

    } finally {
        // Se libera la conexión de la base de datos para evitar fugas de memoria
        connection.release();
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;

    try {

        // Validar que se hayan proporcionado email y contraseña
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Normalizar el email para evitar problemas de mayúsculas/minúsculas y espacios
        const normalizedEmail = email.trim().toLowerCase();

        // Buscar el usuario por email
        const [users] = await db.query(
            `
            SELECT 
                userId, 
                email, 
                password,
                firstName,
                lastName,
                userName
            FROM User 
            WHERE email = ?
            `,
            [normalizedEmail]
        );

        // Si no se encuentra el usuario, se retorna un error de credenciales inválidas
        if (users.length === 0) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Obtener el usuario encontrado (debería ser solo uno debido a la restricción de email único)
        const user = users[0];

        // Comparar la contraseña proporcionada con el hash almacenado en la base de datos
        const isMatch = await bcrypt.compare(password, user.password);

        // Si la contraseña no coincide, se retorna un error de credenciales inválidas
        if (!isMatch) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Si las credenciales son válidas, se genera un token JWT para autenticación futura
        const token = jwt.sign(
            {
                userId: user.userId,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        // Se retorna el token y la información del usuario (sin la contraseña) para que el cliente pueda usarlo en futuras solicitudes autenticadas
        return res.status(200).json({
            message: 'Login correcto',
            token,
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userName: user.userName
            }
        });

    } catch (error) {
        // Se retorna un error genérico con detalles del error para facilitar el debugging
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }
};

module.exports = { login, register };