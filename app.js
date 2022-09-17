const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config');

const userRoutes = require('./api/routes/users');
const restaurantRoutes = require('./api/routes/restaurants');
const itemRoutes = require('./api/routes/items');
const utilitiesRoutes = require('./api/routes/utilities');

mongoose.connect(
  'mongodb+srv://admin:' +
    config.MONGO_ATLAS_PW +
    '@cluster0.aw175.mongodb.net/tryMenu',
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);

// to see requests in the console
app.use(morgan('dev'));
app.use('/uploads', express.static('./uploads'));

// body-parser-> gives a body property to req
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//to handle CORS errors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// routes
app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/items', itemRoutes);
app.use('/', utilitiesRoutes);

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
