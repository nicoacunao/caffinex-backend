const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/notes', (req, res) => {

    const { noteId } = req.query;

    let query = 'SELECT noteId, name, imageUrl FROM Note';
    let params = [];

    if (noteId) {
        query = 'SELECT * FROM Note WHERE noteId = ?';
        params.push(noteId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener notas', details: err });
        }

        res.json(results);
    });
});

module.exports = router;