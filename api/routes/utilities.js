const express = require('express');
const router = express.Router();
const utilitiesController = require('../controllers/utilities');

router.get('/cuisines', utilitiesController.getCuisines);

module.exports = router;
