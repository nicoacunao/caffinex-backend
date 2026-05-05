const express = require('express');
const router = express.Router();
const db = require('../db');

// obtener listas de usuario
router.get('/lists', (req, res) => {

    // Id del usuario
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Falta el id del usuario' });
    }

    // query
    let query = `SELECT l.listId, li.name, li.description
                FROM List l
                INNER JOIN ListInfo li ON l.listInfoId = li.listInfoId
                WHERE l.userId = ?`;
    let params = [];

    params.push(userId);

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener listas del usuario', details: err });
        }

        res.json(results);
    });


});


module.exports = router;