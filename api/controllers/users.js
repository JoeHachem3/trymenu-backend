const User = require('../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const collaborativeFiltering = require('../../algorithms/collaborativeFiltering');

exports.updateRatings = (req, res, next) => {
  if (req.body.ratedItems.length === 0) {
    return res.status(401).json({
      message: 'okay..',
    });
  }
  User.findOne({ _id: req.userData.userId })
    .select('ratedItems averageRating')
    .exec()
    .then((user) => {
      const ratedItems = req.body.ratedItems;
      if (ratedItems[0].rating > 5 || ratedItems[0].rating < 0) {
        return res.status(401).json({
          message: "We see you! but you can't... ",
        });
      }
      if (user.ratedItems.length === 0) {
        user.averageRating = ratedItems[0].rating;
        user.ratedItems.push(ratedItems[0]);
      } else {
        let found = false;
        for (let i = 0; i < user.ratedItems.length; i++) {
          item = user.ratedItems[i];
          if (item.item == ratedItems[0].item) {
            user.averageRating +=
              (ratedItems[0].rating - item.rating) / user.ratedItems.length;
            item.rating = ratedItems[0].rating;
            found = true;
            break;
          }
        }
        if (!found) {
          user.averageRating =
            (user.averageRating * user.ratedItems.length +
              ratedItems[0].rating) /
            (user.ratedItems.length + 1);
          user.ratedItems.push(ratedItems[0]);
        }
      }
      for (let j = 1; j < ratedItems.length; j++) {
        if (ratedItems[j].rating > 5 || ratedItems[j].rating < 0) {
          return res.status(401).json({
            message: "We see you! but you can't... ",
          });
        }
        let found = false;
        for (let i = 0; i < user.ratedItems.length; i++) {
          item = user.ratedItems[i];
          if (item.item == ratedItems[j].item) {
            user.averageRating +=
              (ratedItems[j].rating - item.rating) / user.ratedItems.length;
            item.rating = ratedItems[j].rating;
            found = true;
            break;
          }
        }
        if (!found) {
          user.averageRating =
            (user.averageRating * user.ratedItems.length +
              ratedItems[j].rating) /
            (user.ratedItems.length + 1);
          user.ratedItems.push(ratedItems[j]);
        }
      }
      user.save();
      res.status(201).json({
        message: 'Your rated items updated successfully!',
        ratedItems: user.ratedItems,
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.getRecommendedItems = (req, res, next) => {
  User.findOne({ _id: req.userData.userId })
    .select('_id username first_name last_name email ratedItems averageRating')
    .populate('ratedItems.item', '_id, name')
    .exec()
    .then((user) => {
      const mainUser = user;
      User.find({ _id: { $ne: req.userData.userId } })
        .select(
          '_id username first_name last_name email ratedItems averageRating',
        )
        .populate('ratedItems.item', '_id, name')
        .exec()
        .then((users) => {
          const recommendedItems = collaborativeFiltering.recommendedItems(
            mainUser,
            users,
          );
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
              ratedItem: user.ratedItems,
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
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length === 0) {
        return res.status(401).json({
          message: 'Login failed',
          action: {
            changeEmail: true,
          },
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (error, result) => {
        if (error) {
          return res.status(401).json({
            message: 'Login failed',
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id,
            },
            process.env.JWT_KEY,
            {
              expiresIn: '3h',
            },
          );
          return res.status(200).json({
            message: 'Login successful',
            token: token,
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
