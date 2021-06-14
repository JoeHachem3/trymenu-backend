const mongoose = require('mongoose');
const Item = require('../models/item');
const User = require('../models/user');
const serverError = require('../../utils/serverError');
// const fs = require('fs');

exports.addItemsDev = (req, res, next) => {
  const items = req.body.items;
  if (items) {
    items.forEach((i) => {
      const item = new Item({
        _id: new mongoose.Types.ObjectId(),
        ...i,
      });
      item.save();
    });
    return res.json({ success: true, message: 'backend/uploads/items/' });
  }
  return res.json({
    success: false,
    message: 'make sure your object looks like this: {"items": [{}, {},...]}',
  });
};

exports.getRestaurantItems = (req, res, next) => {
  Item.find({ restaurant: req.params.restaurantId })
    .select('_id name price image category ingredients deletedAt')
    .exec()
    .then((items) => {
      items = items.map((item) => {
        return { item, rating: 0, prevRating: null };
      });
      if (req.userData) {
        if (req.userData.userType === 'customer') {
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
                return res.json({
                  success: true,
                  message:
                    'Make sure to keep your ratings up to date so that recommendations stay accurate.',
                  items,
                });
              } else {
                return res.json({
                  success: true,
                  message:
                    'Give it a try... who knows what your next meal could hold?',
                  items,
                });
              }
            })
            .catch((error) => {
              serverError(res, error);
            });
        } else {
          return res.json({
            success: true,
            items,
          });
        }
      } else {
        return res.json({
          success: true,
          message: 'Make sure to register to start rating items.',
          items,
        });
      }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getAllItems = (req, res, next) => {
  Item.find()
    .select('_id name restaurant image price category ingredients')
    .exec()
    .then((items) => {
      res.json({ success: true, items });
    })
    .catch((error) => {
      serverError(res, error);
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
        image: item.image,
        price: item.price,
        category: item.category,
        ingredients: item.ingredients,
      };
      res.json({
        success: true,
        message: 'Your item was created successfully.',
        item: {
          item: tmp,
          rating: 0,
          prevRating: null,
        },
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getSingleItem = (req, res, next) => {
  const id = req.params.itemId;
  Item.findById(id)
    .select('_id name image price restaurant category ingredients')
    .exec()
    .then((item) => {
      if (item) {
        res.json({ success: true, item });
      } else {
        res.json({ success: false, message: 'Item not found.' });
      }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.updateItem = (req, res, next) => {
  const id = req.params.itemId;
  const updatedItem = { ...req.body };
  if (req.file) {
    updatedItem['image'] = req.file.path;
  }
  Item.updateOne(
    { _id: id },
    {
      $set: updatedItem,
    },
  )
    .exec()
    .then(() => {
      res.json({
        success: true,
        message: 'Your item got successfully updated.',
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.deleteItem = (req, res, next) => {
  const id = req.params.itemId;
  Item.findOne({ _id: id })
    .exec()
    .then((item) => {
      const date = new Date();
      item.deletedAt = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      item.save();
      res.json({
        success: true,
        message: 'Your item was deleted successfully.',
      });
      // try {
      //   const path = item.image.replace(/\/\//, '/').replace(/\\\\/, '/');
      //   fs.unlinkSync(path);
      // } catch (error) {
      //   //sendEmail item image not deleted
      // }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.deleteItems = (req, res, next) => {
  console.log(req.body);
  const itemsToDelete = req.body.itemsToDelete.map((item) => {
    return { _id: item };
  });
  Item.find({ $or: itemsToDelete })
    .exec()
    .then((items) => {
      const date = new Date();
      items.forEach((item) => {
        //   try {
        //     const path = item.image.replace(/\/\//, '/').replace(/\\\\/, '/');
        //     fs.unlinkSync(path);
        //   } catch (error) {
        //     //sendEmail item image not deleted
        //   }

        item.deletedAt = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        item.save();
      });

      // Item.deleteMany({ $or: itemsToDelete })
      //   .exec()
      //   .then((result) => {
      //     console.log(result);
      //     res.status(204).json({ message: 'items deleted successfully' });
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //     res.status(400).json({
      //       message: 'could not delete items... please try again later!',
      //     });
      //   });
      res.json({
        success: true,
        message: 'Your items were deleted successfully.',
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};
