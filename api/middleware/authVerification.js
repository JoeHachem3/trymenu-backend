const jwt = require('jsonwebtoken');
const config = require('../../config');

exports.checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_KEY);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.json({
      success: false,
      message: 'You need an account to do that!',
    });
  }
};

exports.differentiateAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_KEY);
    req.userData = decoded;
    next();
  } catch (error) {
    next();
  }
};
