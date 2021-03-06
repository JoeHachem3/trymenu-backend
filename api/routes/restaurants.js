const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurants');
const {
  checkSuperAdmin,
  checkAdmin,
  checkCustomer,
} = require('../middleware/authVerification');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/restaurants');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, '') + '-' + file.originalname,
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('You can only upload images of type jpeg or png'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

// getRestaurantsByOwner
router.get('/owner', checkAdmin, restaurantsController.getRestaurantsByOwner);
// getFilteredRestaurantsByCuisine
router.get(
  '/cuisine',
  checkCustomer,
  restaurantsController.getFilteredRestaurantsByCuisine,
);
// getAllRestaurants
router.get('/', restaurantsController.getAllRestaurants);
// createNewRestaurant
router.post(
  '/',
  checkSuperAdmin,
  upload.single('logo'),
  restaurantsController.createNewRestaurant,
);
// getSingleRestaurant
router.get('/:restaurantId', restaurantsController.getSingleRestaurants);
// updateRestaurant
router.patch(
  '/:restaurantId',
  checkAdmin,
  upload.single('logo'),
  restaurantsController.updateRestaurant,
);
// deleteRestaurant
router.delete(
  '/:restaurantId',
  checkSuperAdmin,
  restaurantsController.deleteRestaurant,
);

module.exports = router;
