const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, lowercase: true, trim: true },
  logo: { type: String, required: true },
  phone: { type: Number, required: true },
  email: { type: String, unique: true, required: true, trim: true },
  location: [
    {
      XCoordinate: { type: Number, trim: true },
      YCoordinate: { type: Number, trim: true },
    },
  ],
  category: {
    // Fast Food/Drive-thrus | Fast Casual | Sports Bar | Casual Dining | Fine Dining | Pop-up Restaurants | Food Trucks
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  cuisine: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  deletedAt: { type: Date },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
