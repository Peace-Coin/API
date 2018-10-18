const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes for Models
const mobile = require('./routes/api/mobile');

// Express Instance
const app = express();

// DB Config
const db = require('./config/keys').mongoURI;

// Promise
mongoose.Promise = global.Promise;

// Mongodb Connect
mongoose
  .connect(db)
  .then(() => console.log('MongoDB Connected.'))
  .catch(err => console.log(err));

console.log('environment: ', process.env.NODE_ENV);

app.use(morgan('combined'));

app.use(cors());

//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));

// Routes
app.use('/api/mobile', mobile);

var domain = require('express-domain-middleware');
app.use(domain);

module.exports = app;

//https://jwt.io/
//https://github.com/auth0/node-jsonwebtoken
