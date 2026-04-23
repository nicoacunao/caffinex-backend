const db = require('../db');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    const { email, password, firstName, lastName, userName, birthDate, gender, country } = req.body;

    try {
        const [existingUsers] = await db.query(
            'SELECT userId, email FROM User WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO User (email, password, firstName, lastName, userName, birthDate, gender, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, firstName, lastName, userName, birthDate, gender, country]
        );

        return res.status(201).json({ message: 'Usuario creado' });

    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {

        const [users] = await db.query(
            'SELECT userId, email, password FROM User WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];

        // comparar contraseña ingresada con la guardada
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        return res.status(200).json({
            message: 'Login correcto',
            user: {
                userId: user.userId,
                email: user.email,
            },
        });

    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { login, register };