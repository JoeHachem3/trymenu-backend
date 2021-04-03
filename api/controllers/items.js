const mongoose = require('mongoose');
const Item = require('../models/item');

exports.getAllItems = (req, res, next) => {
  Item.find()
    .select('_id name')
    .exec()
    .then((items) => {
      const response = {
        count: items.length,
        items: items.map((item) => {
          return {
            item: {
              _id: item._id,
              name: item.name,
            },
            request: {
              type: 'GET',
              url: 'http://localhost:5000/items/' + item._id,
            },
          };
        }),
      };
      res.status(200).json({ response });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};

exports.createNewItem = (req, res, next) => {
  const item = new Item({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  item
    .save()
    .then(() => {
      res.status(201).json({
        message: 'Your item was created successfully',
        item: {
          _id: item._id,
          name: item.name,
        },
        request: {
          type: 'GET',
          url: 'http://localhost:5000/items/' + item._id,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

exports.getSingleItem = (req, res, next) => {
  const id = req.params.itemId;
  Item.findById(id)
    .select('_id name')
    .exec()
    .then((item) => {
      if (item) {
        res.status(200).json(item);
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};

exports.updateItem = (req, res, next) => {
  const id = req.params.itemId;
  const updatedItem = { ...req.body };
  Item.updateOne(
    { _id: id },
    {
      $set: updatedItem,
    },
  )
    .exec()
    .then(() => {
      res.status(200).json({
        message: `Your ${Object.keys(updatedItem).join(
          ', ',
        )} got successfully updated to ${Object.values(updatedItem).join(
          ', ',
        )}`,
        request: {
          type: 'GET',
          url: 'http://localhost:5000/items/' + id,
        },
      });
    })
    .catch((err) => {
      err.status(500).json({
        error: err,
      });
    });
};

exports.deleteItem = (req, res, next) => {
  const id = req.params.itemId;
  Item.deleteOne({ _id: id })
    .exec()
    .then(() => {
      res.status(200).json({ message: 'Your item was deleted successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
