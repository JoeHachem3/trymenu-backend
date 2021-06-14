const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items');
const {
  differentiateAuth,
  checkAdmin,
} = require('../middleware/authVerification');
const multer = require('multer');

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

//addItemsDev
router.post('/dev', itemsController.addItemsDev);
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
  checkAdmin,
  upload.single('image'),
  itemsController.createNewItem,
);
// getSingleItem
router.get('/:itemId', itemsController.getSingleItem);
// updateItem
router.patch('/:itemId', checkAdmin, itemsController.updateItem);
// deleteItem
router.delete('/:itemId', checkAdmin, itemsController.deleteItem);
//deleteItems
router.post('/delete', checkAdmin, itemsController.deleteItems);

module.exports = router;
