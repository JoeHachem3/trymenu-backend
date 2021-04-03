const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurants');
const checkAuth = require('../middleware/checkAuth');

// getAllRestaurants
router.get('/', restaurantsController.getAllRestaurants);
// createNewRestaurant
router.post('/', checkAuth, restaurantsController.createNewRestaurant);
// getSingleRestaurant
router.get('/:restaurantId', restaurantsController.getSingleRestaurants);
// updateRestaurant
router.patch(
  '/:restaurantId',
  checkAuth,
  restaurantsController.updateRestaurant,
);
// deleteRestaurant
router.delete(
  '/:restaurantId',
  checkAuth,
  restaurantsController.deleteRestaurant,
);

module.exports = router;
