const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/formats', (req, res) => {

  const { formatId } = req.query;

  let query = 'SELECT formatId, name, imageUrl FROM Format';
  let params = [];

  if (formatId) {
    query = 'SELECT * FROM format WHERE formatId = ?';
    params.push(formatId);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener formatos', details: err });
    }

    res.json(results);
  });
});

module.exports = router;