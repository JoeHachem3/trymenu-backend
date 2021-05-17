const Restaurant = require('../models/restaurant');
const Item = require('../models/item');
const mongoose = require('mongoose');
const fs = require('fs');

exports.getAllRestaurants = (req, res, next) => {
  Restaurant.find()
    .select('_id owner name logo phone email location category cuisine')
    .exec()
    .then((restaurants) => {
      const response = {
        count: restaurants.length,
        restaurants: restaurants.map((restaurant) => {
          return {
            _id: restaurant._id,
            owner: restaurant.owner,
            name: restaurant.name,
            logo: restaurant.logo,
            phone: restaurant.phone,
            email: restaurant.email,
            location: restaurant.location,
            category: restaurant.category,
            cuisine: restaurant.cuisine,
          };
        }),
      };
      res.status(200).json({ response });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};

exports.createNewRestaurant = (req, res, next) => {
  console.log(req.body);
  const restaurant = new Restaurant(
    {
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
      location: [
        // ...req.body.location
      ],
      logo: req.file.path,
    },
    { timestamps: true },
  );

  restaurant
    .save()
    .then(() => {
      res.status(201).json({
        message: 'Your restaurant was created successfully',
        restaurant: {
          _id: restaurant._id,
          owner: restaurant.owner,
          name: restaurant.name,
          logo: restaurant.logo,
          phone: restaurant.phone,
          email: restaurant.email,
          location: restaurant.location,
          category: restaurant.category,
          cuisine: restaurant.cuisine,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
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
        res.status(200).json(restaurant);
      } else {
        res.status(404).json({ message: 'Restaurant not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err });
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
      res.status(200).json({
        message: `Your ${Object.keys(updatedRestaurant).join(
          ', ',
        )} got successfully updated to ${Object.values(updatedRestaurant).join(
          ', ',
        )}`,
      });
    })
    .catch((err) => {
      err.status(500).json({
        error: err,
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
          res
            .status(200)
            .json({ message: 'Your restaurant was deleted successfully' });
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
              res.status(500).json({ error: err });
            });
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    });
};
