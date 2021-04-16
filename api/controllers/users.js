const User = require('../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const collaborativeFiltering = require('../../algorithms/collaborativeFiltering');

// overall average rating missing!!!!
exports.updateRatings = (req, res, next) => {
  if (req.body.ratedItems.length === 0) {
    return res.status(401).json({
      message: 'okay..',
    });
  }
  User.findOne({ _id: req.userData.userId })
    .select('restaurants averageRating')
    .exec()
    .then((user) => {
      const restaurant = {};
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
      if (restaurant) {
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

        // const ratedItems = req.body.ratedItems;
        // if (ratedItems[0].rating > 5 || ratedItems[0].rating < 0) {
        //   return res.status(401).json({
        //     message: "We see you! but you can't... ",
        //   });
        // }
        // if (restaurant.ratedItems.length === 0) {
        //   restaurant.averageRating = ratedItems[0].rating;
        //   restaurant.ratedItems.push(ratedItems[0]);
        // } else {
        //   let found = false;
        //   for (let i = 0; i < restaurant.ratedItems.length; i++) {
        //     item = restaurant.ratedItems[i];
        //     if (item.item == ratedItems[0].item) {
        //       restaurant.averageRating +=
        //         (ratedItems[0].rating - item.rating) /
        //         restaurant.ratedItems.length;
        //       item.rating = ratedItems[0].rating;
        //       found = true;
        //       break;
        //     }
        //   }
        //   if (!found) {
        //     restaurant.averageRating =
        //       (restaurant.averageRating * restaurant.ratedItems.length +
        //         ratedItems[0].rating) /
        //       (restaurant.ratedItems.length + 1);
        //     restaurant.ratedItems.push(ratedItems[0]);
        //   }
        // }
        // for (let j = 1; j < ratedItems.length; j++) {
        //   if (ratedItems[j].rating > 5 || ratedItems[j].rating < 0) {
        //     return res.status(401).json({
        //       message: "We see you! but you can't... ",
        //     });
        //   }
        //   let found = false;
        //   for (let i = 0; i < restaurant.ratedItems.length; i++) {
        //     item = restaurant.ratedItems[i];
        //     if (item.item == ratedItems[j].item) {
        //       restaurant.averageRating +=
        //         (ratedItems[j].rating - item.rating) /
        //         restaurant.ratedItems.length;
        //       item.rating = ratedItems[j].rating;
        //       found = true;
        //       break;
        //     }
        //   }
        //   if (!found) {
        //     restaurant.averageRating =
        //       (restaurant.averageRating * restaurant.ratedItems.length +
        //         ratedItems[j].rating) /
        //       (restaurant.ratedItems.length + 1);
        //     restaurant.ratedItems.push(ratedItems[j]);
        //   }
        // }

        user.save();
        res.status(201).json({
          message: message,
          restaurant: restaurant,
        });
      } else {
        res.status(404).json({
          message: 'restaurant not found',
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.getRecommendedItems = (req, res, next) => {
  User.findOne({ _id: req.userData.userId })
    .select('_id restaurants averageRating')
    .populate('restaurants.ratedItems.item', '_id, name')
    .exec()
    .then((user) => {
      const mainUser = user;
      User.find({ _id: { $ne: req.userData.userId } })
        .select('_id restaurants averageRating')
        .populate('restaurants.ratedItems.item', '_id, name')
        .exec()
        .then((users) => {
          if (req.body.restaurantId) {
            const recommendedItems = collaborativeFiltering.recommendedItems(
              mainUser,
              users,
              req.body.restaurantId,
            );
          } else {
            const recommendedItems = collaborativeFiltering.allRecommendedItems(
              mainUser,
              users,
            );
          }

          res.status(200).json({
            recommendedItems: recommendedItems,
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.getAllUsers = (req, res, next) => {
  User.find({ _id: { $ne: req.userData.userId } })
    .select('_id username first_name last_name email ratedItems')
    .populate('ratedItems.item', '_id, name')
    .exec()
    .then((users) => {
      const response = {
        count: users.length,
        users: users.map((user) => {
          return {
            user: {
              _id: user._id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              restaurants: user.restaurants,
            },
            request: {
              type: 'GET',
              url: 'http://localhost:5000/users/' + user._id,
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

exports.register = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length > 0) {
        return res.status(409).json({
          message: 'This email is already used',
          action: {
            login: true,
          },
        });
      } else {
        User.find({ username: req.body.username })
          .exec()
          .then((user) => {
            if (user.length > 0) {
              return res.status(409).json({
                message: 'Username already exists',
                action: {
                  changeUsername: true,
                },
              });
            } else {
              bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                  return res.status(500).json({
                    error: err,
                  });
                } else {
                  const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    ...req.body,
                    password: hash,
                  });
                  const token = jwt.sign(
                    {
                      email: user.email,
                      userId: user._id,
                    },
                    process.env.JWT_KEY,
                    {
                      expiresIn: '3h',
                    },
                  );
                  user
                    .save()
                    .then(() => {
                      res.status(201).json({
                        message: 'Your profile was created successfully',
                        token: token,
                        expiresIn: new Date().getTime() + 10800000,
                        user: {
                          _id: user._id,
                          username: user.username,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          email: user.email,
                        },
                        request: {
                          type: 'GET',
                          url: 'http://localhost:5000/users/' + user._id,
                        },
                      });
                    })
                    .catch((err) => {
                      res.status(500).json({
                        error: err,
                      });
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
        return res.status(401).json({
          message: 'Login failed',
          action: {
            changeEmail: true,
          },
        });
      }
      bcrypt.compare(req.body.password, user.password, (error, result) => {
        if (error) {
          return res.status(401).json({
            message: 'Login failed',
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id,
            },
            process.env.JWT_KEY,
            {
              expiresIn: '3h',
            },
          );
          return res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
              _id: user._id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            },
            expiresIn: new Date().getTime() + 10800000,
          });
        }
        res.status(401).json({
          message: 'Login failed',
          action: {
            changePassword: true,
          },
        });
      });
    })
    .catch((err) => {
      res.status(401).json({
        error: err,
      });
    });
};

exports.getSingleUser = (req, res, next) => {
  const id = req.params.userId;
  User.findById(id)
    .populate('ratedItems.item', '_id name')
    .select('_id username first_name last_name email ratedItems')
    .exec()
    .then((user) => {
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};

exports.updateUser = (req, res, next) => {
  const id = req.params.userId;
  if (req.userData.userId === id) {
    const updatedUser = { ...req.body };
    User.updateOne(
      { _id: id },
      {
        $set: updatedUser,
      },
    )
      .exec()
      .then(() => {
        res.status(200).json({
          message: 'Your account was successfully updated',
          request: {
            type: 'GET',
            url: 'http://localhost:5000/users/' + id,
          },
        });
      })
      .catch((err) => {
        err.status(500).json({
          error: err,
        });
      });
  } else {
    res.status(401).json({
      message: "Can't update this profile",
    });
  }
};

exports.deleteUser = (req, res, next) => {
  const id = req.params.userId;
  User.deleteOne({ _id: id })
    .exec()
    .then(() => {
      res
        .status(200)
        .json({ message: 'Your account was deleted successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
