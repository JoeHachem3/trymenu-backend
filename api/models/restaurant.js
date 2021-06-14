const mongoose = require('mongoose');
const { cuisines, restaurantCategories } = require('../../utils/enums');

const restaurantSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, lowercase: true, trim: true },
    logo: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    location: [
      {
        XCoordinate: { type: Number, trim: true },
        YCoordinate: { type: Number, trim: true },
      },
    ],
    category: {
      type: String,
      lowercase: true,
      trim: true,
      enum: restaurantCategories,
    },
    cuisines: [
      {
        type: String,
        lowercase: true,
        trim: true,
        enum: cuisines,
      },
    ],
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
