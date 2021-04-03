const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true, lowercase: true, trim: true },
  //   category: { type: String, required: true, lowercase: true, trim: true },
  //   ingredients: [{ type: mongoose.Schema.Types.ObjectId, ingredient: 'Ingredient' }],
});

module.exports = mongoose.model('Item', itemSchema);
