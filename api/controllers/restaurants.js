const Restaurant = require('../models/restaurant');
const mongoose = require('mongoose');
const fs = require('fs');

exports.getAllRestaurants = (req, res, next) => {
  Restaurant.find()
    .select('_id owner name logo phone email location category')
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
  const restaurant = new Restaurant({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
    location: [
      // ...req.body.location
    ],
    logo: req.file.path,
  });

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
          menu: restaurant.menu,
        },
        request: {
          type: 'GET',
          url: 'http://localhost:5000/restaurants/' + restaurant._id,
        },
      });
    })
    .catch((err) => {
      console.log('cool');
      res.status(500).json({
        error: err,
      });
    });
};

exports.getSingleRestaurants = (req, res, next) => {
  const id = req.params.restaurantId;
  Restaurant.findById(id)
    .select(/*_id owner name logo phone email location category */ 'menu')
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
        request: {
          type: 'GET',
          url: 'http://localhost:5000/restaurants/' + id,
        },
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
      Restaurant.deleteOne({ _id: id })
        .exec()
        .then((result) => {
          res
            .status(200)
            .json({ message: 'Your restaurant was deleted successfully' });
          try {
            const path = resto.logo.replace(/\/\//, '/').replace(/\\\\/, '/');
            console.log(path);
            fs.unlinkSync(path);
          } catch (err) {
            console.log(err);
          }
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    });
};
