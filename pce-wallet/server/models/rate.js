const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const rateSchema = new Schema({
  bitcoinRate: {
    type: String,
  },
  usdRate: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create a model
const Rate = mongoose.model('rate', rateSchema);

// Export the model
module.exports = Rate;
