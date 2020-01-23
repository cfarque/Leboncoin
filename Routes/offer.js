const express = require("express");
const router = express.Router();

//const uid2 = require("uid2");
//const SHA256 = require("crypto-js/sha256");
//const encBase64 = require("crypto-js/enc-base64");

const User = require("../Models/User");
const Offer = require("../Models/Offer");
const isAuthenticated = require("../Middleware/isAuthenticated");
const createFilter = require("../Middleware/createFilter");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const offer = new Offer({
      title: req.fields.title,
      description: req.fields.description,
      price: req.fields.price,
      creator: req.user
    });
    await offer.save();
    res.json({
      _id: offer.id,
      title: offer.title,
      date: offer.created,
      description: offer.description,
      created: offer.date,
      creator: {
        username: offer.creator.account.username,
        _id: offer.creator._id
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/offer/with-count", createFilter, async (req, res) => {
  try {
    const filters = createFilter(req);

    const search = Offer.find(filters).populate("creator");
    if (req.query.sort === "price-asc") {
      search.sort({ price: 1 });
    } else if (req.query.sort === "price-desc") {
      search.sort({ price: -1 });
    }
    if (req.query.date === "date-desc") {
      search.sort({ date: -1 });
    } else if (req.query.date === "date-asc") {
      search.sort({ date: 1 });
    }

    if (req.query.page) {
      const page = req.query.page;
      const limit = req.query.limit || 50;
      search.limit(limit).skip(limit * (page - 1));
    }
    const offers = await search;

    res.json(offers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
