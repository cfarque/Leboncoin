const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { type: String, unique: true },
  token: String,
  salt: String,
  hash: String,
  account: {
    username: { type: String, required: true },
    phone: { type: String }
  }
});

module.exports = User;
