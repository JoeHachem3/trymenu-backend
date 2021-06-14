const User = require('../models/user');
const mongoose = require('mongoose');
const serverError = require('../../utils/serverError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const collaborativeFiltering = require('../../algorithms/collaborativeFiltering');

exports.updateRatings = (req, res, next) => {
  if (req.body.ratedItems.length === 0) {
    return res.json({
      success: true,
    });
  }
  User.findOne({ _id: req.userData.userId })
    .select('restaurants averageRating')
    .exec()
    .then((user) => {
      let restaurant;
      const restaurants = [];
      let averageRating = 0;
      let itemCounter = 0;
      user.restaurants.forEach((resto) => {
        if (resto._id.toString() === req.body._id) {
          restaurant = resto;
        } else {
          restaurants.push(resto);
          averageRating += resto.averageRating * resto.ratedItems.length;
          itemCounter += resto.ratedItems.length;
        }
      });
      if (!restaurant) {
        restaurant = { _id: req.body._id };
      }
      const ratedItems = [];
      let restaurantRating = 0;
      req.body.ratedItems.forEach((item) => {
        if (item.rating >= 0 && item.rating <= 5) {
          ratedItems.push(item);
          restaurantRating += item.rating;
        }
      });
      restaurant.ratedItems = ratedItems;
      if (ratedItems.length > 0) {
        averageRating += restaurantRating;
        itemCounter += ratedItems.length;
        restaurant.averageRating = restaurantRating / ratedItems.length;
      }

      restaurants.push(restaurant);
      user.restaurants = restaurants;
      user.averageRating = averageRating / itemCounter;

      let message;
      if (ratedItems.length !== req.body.ratedItems.length) {
        message =
          'Some of your rated items updated successfully. Make sure the ratings are between 0 and 5!';
      } else {
        message = 'Your rated items updated successfully!';
      }

      user.save();
      res.json({
        success: true,
        message: message,
        restaurant: restaurant,
        restaurants: restaurants,
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getRecommendedItems = (req, res, next) => {
  User.findOne({ _id: req.userData.userId })
    .select('_id restaurants averageRating')
    .populate('restaurants.ratedItems._id')
    .exec()
    .then((user) => {
      const mainUser = user;
      User.find({ _id: { $ne: req.userData.userId } })
        .select('_id restaurants averageRating')
        .populate('restaurants.ratedItems._id')
        .exec()
        .then((users) => {
          let recommendedItems;
          if (req.body.restaurantId) {
            recommendedItems = collaborativeFiltering.recommendedItems(
              mainUser,
              users,
              req.body.restaurantId,
            );
          } else {
            recommendedItems = collaborativeFiltering.allRecommendedItems(
              mainUser,
              users,
            );
          }

          res.json({ success: true, recommendedItems });
        });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getAllUsers = (req, res, next) => {
  User.find({ _id: { $ne: req.userData.userId } })
    .select(
      '_id username userType first_name last_name email cuisines restaurants',
    )
    .exec()
    .then((users) => {
      res.json({ success: true, users });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.register = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length > 0) {
        return res.json({
          success: false,
          message: 'This email is already used',
        });
      } else {
        User.find({ username: req.body.username })
          .exec()
          .then((user) => {
            if (user.length > 0) {
              return res.json({
                success: false,
                message: 'Username already exists',
              });
            } else {
              bcrypt.hash(req.body.password, 10, (error, hash) => {
                if (error) {
                  serverError(res, error);
                } else {
                  const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    ...req.body,
                    password: hash,
                    userType: req.body.userType
                      ? req.body.userType
                      : 'customer',
                  });
                  const token = jwt.sign(
                    {
                      email: user.email,
                      userId: user._id,
                      userType: user.userType,
                    },
                    config.JWT_KEY,
                    {
                      expiresIn: '3h',
                    },
                  );
                  user
                    .save()
                    .then(() => {
                      res.json({
                        success: true,
                        message: `${user.first_name}, welcome to TryMenu!`,
                        token: token,
                        expiresIn: new Date().getTime() + 10800000,
                        user: {
                          tutorial: true,
                          _id: user._id,
                          username: user.username,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          userType: user.userType,
                          email: user.email,
                          cuisines: user.cuisines,
                          restaurants: user.restaurants,
                        },
                      });
                    })
                    .catch((error) => {
                      serverError(res, error);
                    });
                }
              });
            }
          });
      }
    });
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .exec()
    .then((user) => {
      if (!user) {
        return res.json({
          success: false,
          message: "Your email or password isn't correct.",
        });
      }
      if (!user.userType) {
        user.userType = 'customer';
        user.save();
      }
      bcrypt.compare(req.body.password, user.password, (error, result) => {
        if (error) {
          serverError(res, error);
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id,
              userType: user.userType,
            },
            config.JWT_KEY,
            {
              expiresIn: '3h',
            },
          );
          return res.json({
            success: true,
            message: `${user.first_name}, welcome back to TryMenu!`,
            token: token,
            expiresIn: new Date().getTime() + 10800000,
            user: {
              _id: user._id,
              username: user.username,
              userType: user.userType,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              cuisines: user.cuisines,
              restaurants: user.restaurants,
            },
          });
        }
        res.json({
          success: false,
          message: "Your email or password isn't correct.",
        });
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.getSingleUser = (req, res, next) => {
  const id = req.params.userId;
  User.findById(id)
    .select(
      '_id username userType first_name last_name email cuisines restaurants',
    )
    .exec()
    .then((user) => {
      if (user) {
        res.json({
          success: true,
          user,
        });
      } else {
        res.json({ success: false, message: 'User not found.' });
      }
    })
    .catch((error) => {
      serverError(res, error);
    });
};

exports.updateUser = (req, res, next) => {
  const id = req.params.userId;
  if (req.userData.userId === id) {
    const updatedUser = { ...req.body };

    if (req.file) {
      updatedUser['image'] = req.file.path;
    }
    User.updateOne(
      { _id: id },
      {
        $set: updatedUser,
      },
    )
      .exec()
      .then(() => {
        res.json({
          success: true,
          message: 'Your account was successfully updated.',
        });
      })
      .catch((error) => {
        serverError(res, error);
      });
  } else {
    res.json({
      success: false,
      message: "Can't update this profile.",
    });
  }
};

exports.deleteUser = (req, res, next) => {
  const id = req.params.userId;
  User.deleteOne({ _id: id })
    .exec()
    .then(() => {
      res.json({
        success: true,
        message: 'Your account was deleted successfully',
      });
    })
    .catch((error) => {
      serverError(res, error);
    });
};
