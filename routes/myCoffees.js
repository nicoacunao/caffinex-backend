const express = require('express');
const router = express.Router();
const { getMyCoffees, addMyCoffee} = require('../controllers/myCoffeesController');


router.get('/my-coffees', getMyCoffees);
router.post('/my-coffees', addMyCoffee);

module.exports = router;