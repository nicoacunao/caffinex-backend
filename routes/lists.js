const express = require('express');
const router = express.Router();
const db = require('../db');

// obtener listas de usuario
router.get('/lists', (req, res) => {

    // Id del usuario
    const { userId } = req.query;

    // query
    let query = 'SELECT listId, name, description FROM List WHERE userId = ?';
    let params = [];

    params.push(formatId);

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener listas del usuario', details: err });
        }

        res.json(results);
    });


});

// Crear una lista del usuario
router.post('/lists', (req, res) => {
    const { userId, name, description } = req.body;

    try {

        const [existingLists] = db.query(
            'SELECT listId, name FROM List WHERE name = ?',
            [name]
        );

        if (existingLists.length > 0) {
            return res.status(409).json({ message: 'La lista ya existe' });
        }

        db.query(
            'INSERT INTO List (name, description, userId) VALUES (?, ?, ?)',
            [name, description, userId]
        );

        return res.status(201).json({ message: 'Lista creada' });

    } catch(error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
});

module.exports = router;