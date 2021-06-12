const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/authVerification');
const usersController = require('../controllers/users');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/users');
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

// updateRatings
router.patch('/rating', checkAuth, usersController.updateRatings);
// getRecommendedItems
router.post('/cf-items', checkAuth, usersController.getRecommendedItems);
// getAllUsers
router.get('/', checkAuth, usersController.getAllUsers);
// register
router.post('/register', usersController.register);
// login
router.post('/login', usersController.login);
// getSingleUser
router.get('/:userId', checkAuth, usersController.getSingleUser);
// updateUser
router.patch(
  '/:userId',
  checkAuth,
  upload.single('image'),
  usersController.updateUser,
);
// deleteUser
router.delete('/:userId', checkAuth, usersController.deleteUser);

module.exports = router;
