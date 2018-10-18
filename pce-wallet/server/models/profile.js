const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const profileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  handle: {
    type: String,
    max: 40
  },
  Profile: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    gender: {
      type: String
    },
    country: {
      type: String
    },
    phoneNumber1: {
      type: String
    },
    phoneNumber2: {
      type: String
    },
    birth: {
      type: String,
    },
    postalCode: {
      type: String
    },
    cityAddress: {
      type: String
    },
    streetAddress: {
      type: String
    },
    nationality: {
      type: String
    },
    idNumber: {
      type: String
    },
    passport: {
      type: String,
    },
    certificateResidence: {
      type: String,
    },
    picture: {
      type: String,
    },
    ethereumAddress: {
      type: String,
    },
    bitcoinAddress: {
      type: String,
    },
    aml: {
      type: String,
    },
    status: { //1:confirm, 2:approve, ... 9:system error
      type: String,
    },
    statusName: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create a model
const Profile = mongoose.model('profile', profileSchema);

// Export the model
module.exports = Profile;
