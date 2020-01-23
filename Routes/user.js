const express = require("express");
const router = express.Router();

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../Models/User");

router.post("/user/log_in", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });
    if (user) {
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.json({ _id: user._id, token: user.token, account: user.account });
      } else {
        res.json({ message: "Unauthorized" });
      }
    } else {
      res.json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/sign_up", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });
    /*
    je vérifie que l'adresse email n'est pas déjà utilisée.
    */
    if (req.fields.username && req.fields.email && req.fields.password) {
      if (!user) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const newUser = new User({
          email: req.fields.email,
          token: token,
          salt: salt,
          hash: hash,
          account: {
            username: req.fields.username,
            phone: req.fields.phone
          }
        });
        await newUser.save();
        res.json({
          // ne renvoyer que les données non sensibles et utiles côté client
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account
        });
      } else {
        res.json({ message: "Email already used" });
      }
    } else {
      res.json({ message: "All parameters are required" });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
