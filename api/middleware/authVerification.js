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

exports.checkSuperAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_KEY);
    if (decoded.userType === 'superAdmin') {
      req.userData = decoded;
      next();
    } else {
      return res.json({
        success: false,
        message: 'You need a superAdmin account to do that!',
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      message: 'You need an account to do that!',
    });
  }
};

exports.checkAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_KEY);
    if (decoded.userType === 'admin') {
      req.userData = decoded;
      next();
    } else {
      return res.json({
        success: false,
        message: 'You need an admin account to do that!',
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      message: 'You need an account to do that!',
    });
  }
};

exports.checkCustomer = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_KEY);
    if (decoded.userType === 'customer') {
      req.userData = decoded;
      next();
    } else {
      return res.json({
        success: false,
        message: 'You need a customer account to do that!',
      });
    }
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
