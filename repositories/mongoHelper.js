"use strict"

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://192.168.31.25:27017/CIG");

mongoose.connection.on('connected', function() {
    console.log('MongoDB connected !');
});

mongoose.connection.on('error', function(err) {
    console.log('MongoDB connection error: ' + err);
});

module.exports.DepModel = require('./models/depinfo');
module.exports.UserModel = require("./models/userinfo");
module.exports.InsInfoModel = require("./models/insinfo");
module.exports.InsCodeModel = require("./models/inscode");
module.exports.TestModel = require("./models/test.js");
module.exports.AuthModel = require("./models/auth.js");
module.exports.EmailModel = require("./models/email.js");
module.exports.ConfigModel= require("./models/config.js");