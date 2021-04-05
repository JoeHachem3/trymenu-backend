const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth');
// to parse files:
// const multer = require('multer')
const usersController = require('../controllers/users');

// updateRatings
router.patch('/rating', checkAuth, usersController.updateRatings);
// getRecommendedItems
router.get('/cf-items', checkAuth, usersController.getRecommendedItems);
// getAllUsers
router.get('/', checkAuth, usersController.getAllUsers);
// register
router.post('/register', usersController.register);
// login
router.post('/login', usersController.login);
// getSingleUser
router.get('/:userId', checkAuth, usersController.getSingleUser);
// updateUser
router.patch('/:userId', usersController.updateUser);
// deleteUser
router.delete('/:userId', usersController.deleteUser);

module.exports = router;
