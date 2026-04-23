const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/brands', (req, res) => {

  const { brandId } = req.query;

  let query = 'SELECT brandId, name, imageUrl FROM Brand';
  let params = [];

  if (brandId) {
    query = 'SELECT * FROM Brand WHERE brandId = ?';
    params.push(brandId);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener marcas', details: err });
    }

    res.json(results);
  });
});

module.exports = router;