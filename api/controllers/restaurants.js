const Restaurant = require('../models/restaurant');
const User = require('../models/user');
const Item = require('../models/item');
const mongoose = require('mongoose');
const serverError = require('../../utils/serverError');
// const fs = require('fs');

exports.getFilteredRestaurantsByCuisine = (req, res, next) => {
  const { userId } = req.userData;
  User.findById(userId)
    .exec()
    .then((user) => {
      const cuisine = user.cuisine;
      if (!cuisine.length) {
        this.getAllRestaurants(req, res, next);
      } else {
        const tmp = cuisine.map((c) => {
          return { cuisine: c };
        });
        Restaurant.find({ $or: tmp })
          .select('_id owner name logo phone email location category cuisine')
          .exec()
          .then((recommended) => {
            Restaurant.find({ $not: tmp })
              .select(
                '_id owner name logo phone email location category cuisine',
              )
              .exec()
              .then((restaurants) => {
                recommended.forEach((resto) => {
                  resto.byCuisine = true;
                  restaurants.push(resto);
                });
                res.json({ success: true, restaurants });
              })
              .catch((error) => {
                serverError(res, error);
              });
          })
          .catch((error) => {
            serverError(res, error);
          });
      }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getAllRestaurants = (req, res, next) => {
  Restaurant.find()
    .select('_id owner name logo phone email location category cuisine')
    .exec()
    .then((restaurants) => {
      res.json({ success: true, restaurants });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.createNewRestaurant = (req, res, next) => {
  console.log(req.body);
  const restaurant = new Restaurant({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
    logo: req.file.path,
  });

  restaurant
    .save()
    .then(() => {
      res.json({
        success: true,
        message: 'Your restaurant was created successfully.',
        restaurant,
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getSingleRestaurants = (req, res, next) => {
  const id = req.params.restaurantId;
  Restaurant.findById(id)
    .select('_id owner name logo phone email location category cuisine')
    .exec()
    .then((restaurant) => {
      if (restaurant) {
        res.json({ success: true, restaurant });
      } else {
        res.json({ success: false, message: 'Restaurant not found.' });
      }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.updateRestaurant = (req, res, next) => {
  const id = req.params.restaurantId;
  const updatedRestaurant = { ...req.body };
  if (req.file) {
    updatedRestaurant['logo'] = req.file.path;
  }
  Restaurant.updateOne(
    { _id: id },
    {
      $set: updatedRestaurant,
    },
  )
    .exec()
    .then(() => {
      res.json({
        success: true,
        message: 'Your restaurant updated successfully.',
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.deleteRestaurant = (req, res, next) => {
  const id = req.params.restaurantId;
  Restaurant.findOne({ _id: id })
    .exec()
    .then((resto) => {
      Restaurant.findOne({ _id: id })
        .exec()
        .then((restaurant) => {
          const date = new Date();
          restaurant.deletedAt = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          restaurant.save();
          res.json({
            success: true,
            message: 'Your restaurant was deleted successfully.',
          });
          // try {
          //   const path = resto.logo.replace(/\/\//, '/').replace(/\\\\/, '/');
          //   fs.unlinkSync(path);
          // } catch (err) {
          //   // sendEmail restaurant logo not deleted
          // }
          Item.find({ restaurant: id })
            .exec()
            .then((items) => {
              items.forEach((item) => {
                item.restaurantDeletedIn = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                item.save();
                // try {
                //   const path = item.image
                //     .replace(/\/\//, '/')
                //     .replace(/\\\\/, '/');
                //   fs.unlinkSync(path);
                // } catch (err) {
                //   // sendEmail item images not deleted
                // }

                // to delete items

                // Item.deleteMany({ restaurant: id })
                //   .exec()
                //   .then(() => {
                //     items.forEach((item) => {
                //       try {
                //         const path = item.image
                //           .replace(/\/\//, '/')
                //           .replace(/\\\\/, '/');
                //         fs.unlinkSync(path);
                //       } catch (err) {
                //         // sendEmail item images not deleted
                //       }
                //     });
                //   })
                //   .catch((err) => {
                //     // sendEmail items not deleted
              });
            })
            .catch((error) => {
              serverError(res, error);
            });
        })
        .catch((error) => {
          serverError(res, error);
        });
    });
};
