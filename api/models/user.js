const mongoose = require('mongoose');
const { cuisines, userTypes } = require('../../utils/enums');

const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match:
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    },
    password: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    userType: {
      type: String,
      required: true,
      trim: true,
      enum: userTypes,
      default: 'customer',
    },
    cuisines: [
      {
        type: String,
        lowercase: true,
        trim: true,
        enum: cuisines,
      },
    ],
    restaurants: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
        ratedItems: [
          {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
            rating: { type: Number, min: 0, max: 5 },
            prevRating: { type: Number, min: 0, max: 5 },
          },
        ],
        averageRating: { type: Number, default: 0 },
      },
    ],
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
