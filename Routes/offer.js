const express = require("express");
const router = express.Router();

//const uid2 = require("uid2");
//const SHA256 = require("crypto-js/sha256");
//const encBase64 = require("crypto-js/enc-base64");

const User = require("../Models/User");
const Offer = require("../Models/Offer");
const isAuthenticated = require("../Middleware/isAuthenticated");

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

const createFilter = req => {
  const filters = {};
  if (req.query.priceMin) {
    filters.price = {};
    filters.price.$gte = req.query.priceMin;
  }
  if (req.query.priceMax) {
    if (filters.price === undefined) {
      filters.price = {};
    }
    filters.price.$lte = req.query.priceMax;
  }
  if (req.query.title) {
    filters.title = new RegExp(req.query.title, "i");
  }
  return filters;
};
router.get("/offer/with-count", async (req, res) => {
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

router.get("/offer/:id", async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  res.json({
    _id: offer.id,
    title: offer.title,
    description: offer.description,
    price: offer.price,
    creator: {
      account: {
        username: offer.cerator.account.username,
        phone: offer.creator.account.phone
      },
      _id: offer.creator.id
    },
    created: offer.created
  });
});

module.exports = router;
