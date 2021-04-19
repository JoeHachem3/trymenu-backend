const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items');
const checkAuth = require('../middleware/checkAuth');
const multer = require('multer');
const differentiateAuth = require('../middleware/differentiateAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/items');
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
// getRestaurantItems
router.get(
  '/:restaurantId',
  differentiateAuth,
  itemsController.getRestaurantItems,
);
// getAllItems
router.get('/', itemsController.getAllItems);
// createNewItem
router.post(
  '/',
  checkAuth,
  upload.single('image'),
  itemsController.createNewItem,
);
// getSingleItem
router.get('/:itemId', itemsController.getSingleItem);
// updateItem
router.patch('/:itemId', checkAuth, itemsController.updateItem);
// deleteItem
router.delete('/:itemId', checkAuth, itemsController.deleteItem);
//deleteItems
router.post('/delete', checkAuth, itemsController.deleteItems);

module.exports = router;
