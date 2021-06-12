const Restaurant = require('../models/restaurant');
const Item = require('../models/item');
const mongoose = require('mongoose');
// const fs = require('fs');

exports.getFilteredRestaurantsByCuisine = (req, res, next) => {
  const { cuisine } = req.body;
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
          .select('_id owner name logo phone email location category cuisine')
          .exec()
          .then((restaurants) => {
            res.json({ success: true, recommended, restaurants });
          })
          .catch((err) => {
            res.json({
              success: false,
              message: 'Oops, something went wrong... please try again later!',
            });
          });
      })
      .catch((err) => {
        res.json({
          success: false,
          message: 'Oops, something went wrong... please try again later!',
        });
      });
  }
};

exports.getAllRestaurants = (req, res, next) => {
  Restaurant.find()
    .select('_id owner name logo phone email location category cuisine')
    .exec()
    .then((restaurants) => {
      res.json({ success: true, restaurants });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: 'Oops, something went wrong... please try again later!',
      });
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
    .catch((err) => {
      res.json({
        success: false,
        message: 'Oops, something went wrong... please try again later!',
      });
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
    .catch((err) => {
      res.json({
        success: false,
        message: 'Oops, something went wrong... please try again later!',
      });
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
    .catch((err) => {
      res.json({
        success: false,
        message: 'Oops, something went wrong... please try again later!',
      });
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
            .catch((err) => {
              res.json({
                success: false,
                message:
                  'Oops, something went wrong... please try again later!',
              });
            });
        })
        .catch((err) => {
          res.json({
            success: false,
            message: 'Oops, something went wrong... please try again later!',
          });
        });
    });
};
