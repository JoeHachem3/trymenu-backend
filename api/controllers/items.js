const mongoose = require('mongoose');
const Item = require('../models/item');
const User = require('../models/user');
const fs = require('fs');
const item = require('../models/item');

exports.getRestaurantItems = (req, res, next) => {
  Item.find({ restaurant: req.params.restaurantId })
    .select('_id name price image category ingredients')
    .exec()
    .then((items) => {
      items = items.map((item) => {
        return { item, rating: 0, prevRating: null };
      });
      if (req.userData) {
        User.findOne({ _id: req.userData.userId })
          .select('restaurants')
          .exec()
          .then((user) => {
            let counter = 0;
            const restaurant = user.restaurants.find(
              (resto) => resto._id.toString() === req.params.restaurantId,
            );
            if (restaurant) {
              let i = 0;
              while (
                i < items.length &&
                counter < restaurant.ratedItems.length
              ) {
                const ratedItem = restaurant.ratedItems.find(
                  (item) =>
                    item._id.toString() === items[i].item._id.toString(),
                );
                if (ratedItem) {
                  counter++;
                  items[i].rating = ratedItem.rating;
                  if (ratedItem.prevRating !== null) {
                    items[i].prevRating = ratedItem.prevRating;
                  }
                }
                i++;
              }
              return res.status(200).json({
                message:
                  'Make sure to keep your ratings up to date so that recommendations are accurate',
                items: items,
              });
            } else {
              return res.status(200).json({
                message:
                  'Give it a try... who knows what could your next meal hold?',
                items: items,
              });
            }
          })
          .catch((err) => {
            return res.status(200).json({
              message: "Can't get your rated items now... try again later!",
              items: items,
            });
          });
      } else {
        return res.status(200).json({
          message: 'Make sure to register to start rating items',
          items: items,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({ err });
    });
};

exports.getAllItems = (req, res, next) => {
  Item.find()
    .select('_id name image category')
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
    image: req.file.path,
  });
  item
    .save()
    .then(() => {
      const tmp = {
        _id: item._id,
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image,
        rating: 0,
      };
      res.status(201).json({
        message: 'Your item was created successfully',
        item: {
          item: tmp,
          rating: 0,
          prevRating: null,
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
    .select('_id name image category')
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
        message: 'Your item got successfully updated',
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
  Item.findOne({ _id: id })
    .exec()
    .then((item) => {
      Item.deleteOne({ _id: id })
        .exec()
        .then(() => {
          res
            .status(200)
            .json({ message: 'Your item was deleted successfully' });
          try {
            const path = item.image.replace(/\/\//, '/').replace(/\\\\/, '/');
            fs.unlinkSync(path);
          } catch (err) {
            //sendEmail item image not deleted
          }
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    })

    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
