const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true, lowercase: true, trim: true },
  price: { type: Number, required: true, trim: true },
  image: { type: String, required: true },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  category: {
    type: String,
    default: undefined,
    lowercase: true,
    trim: true,
    // required: true,
  },
  ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
  restaurantDeletedAt: { type: Date },
  deletedAt: { type: Date },
});

module.exports = mongoose.model('Item', itemSchema);
