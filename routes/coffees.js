const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/coffees', (req, res) => {
  const { brandId, formatId, noteId, coffeeId } = req.query;

  let query = '';
  let params = [];

  if (brandId) {
    query = 'SELECT coffeeId, name, imageUrl FROM Coffee WHERE brandId = ?';
    params.push(brandId);
  }

  if (formatId) {
    query = 'SELECT coffeeId, name, imageUrl FROM Coffee WHERE formatId = ?';
    params.push(formatId);
  }

  if (noteId) {
    query = 'SELECT c.coffeeId, c.name, c.imageUrl FROM Coffee c INNER JOIN CoffeeNote cn ON c.coffeeId = cn.coffeeId WHERE cn.noteId = ?';
    params.push(noteId);
  }

  if (coffeeId) {
    query = 'SELECT * FROM Coffee WHERE coffeeId = ?';
    params.push(coffeeId);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al obtener cafes',
        details: err,
      });
    }

    res.json(results);
  });
});

module.exports = router;