const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const icoSchema = new Schema({
  raisedFund: {
    type: String
  },
  openingTime: {
    type: String
  },
  closingTime: {
    type: String
  },
  pceRate: {
    type: String
  },
  cap: {
    type: String
  },
  goal: {
    type: String
  }
});

// Create a model
const Ico = mongoose.model('ico', icoSchema);

// Export the model
module.exports = Ico;
