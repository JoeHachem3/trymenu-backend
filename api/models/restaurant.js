const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: Number, required: true },
  email: { type: String, unique: true, required: true, trim: true },
  location: [
    {
      XCoordinate: { type: Number, trim: true },
      YCoordinate: { type: Number, trim: true },
    },
  ],
  category: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
