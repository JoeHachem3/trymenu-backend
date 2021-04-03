const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items');
const checkAuth = require('../middleware/checkAuth');

// getAllItems
router.get('/', itemsController.getAllItems);
// createNewItem
router.post('/', checkAuth, itemsController.createNewItem);
// getSingleItem
router.get('/:itemId', itemsController.getSingleItem);
// updateItem
router.patch('/:itemId', checkAuth, itemsController.updateItem);
// deleteItem
router.delete('/:itemId', checkAuth, itemsController.deleteItem);

module.exports = router;
