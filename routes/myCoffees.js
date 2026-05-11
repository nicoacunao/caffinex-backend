const express = require('express');
const router = express.Router();
const { getMyCoffees, addMyCoffeeToFirstList, changeMyCoffeeList, addReviewMyCoffee} = require('../controllers/myCoffeesController');


router.get('/my-coffees', getMyCoffees);
router.post('/my-coffees/add-to-list', addMyCoffeeToFirstList);
router.post('/my-coffees/change-list', changeMyCoffeeList);
router.post('/my-coffees/review', addReviewMyCoffee);

module.exports = router;