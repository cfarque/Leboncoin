require("dotenv").config();
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

//const uid2 = require("uid2");
//const SHA256 = require("crypto-js/sha256");
//const encBase64 = require("crypto-js/enc-base64");

const User = require("../Models/User");
const Offer = require("../Models/Offer");
const isAuthenticated = require("../Middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    cloudinary.uploader.upload(req.files.picture.path, async function(
      error,
      result
    ) {
      console.log(result.secure_url);
      // res.json({url: result.secure_url})
      // je créé une nouvelle offre
      const offer = new Offer({
        title: req.fields.title,
        description: req.fields.description,
        price: req.fields.price,
        creator: req.user,
        picture: result.secure_url
      });
      // je sauvegarde l'offre
      await offer.save();
      console.log(offer);
      res.json({
        _id: offer.id,
        title: offer.title,
        date: offer.created,
        description: offer.description,
        created: offer.date,
        pictures: offer.picture,
        creator: {
          username: offer.creator.account.username,
          _id: offer.creator._id
        }
      });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const createFilter = req => {
  // je créé des filtres
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
    // j'utilise les filtres
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
    // je créé une constante qui contient le résultat de la recherche
    const offers = await search;
    const count = offers.length;
    const tab = [];
    // je parcours ma recherche
    offers.forEach(offer => {
      // pour chaque offre je créé un nouvel objet avec des clés
      const newOffer = {};
      (newOffer._id = offer.id),
        (newOffer.title = offer.title),
        (newOffer.description = offer.description),
        (newOffer.price = offer.price),
        (newOffer.created = offer.created);
      newOffer.pictures = offer.pictures;
      //
      tab.push(newOffer);
    });

    res.json({ count: count, offers: tab });
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
    pictures: offer.picture,
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

// router.post("/offer/upload", (req, res) => {
//   // on log les fichiers reçus
//   console.log(req.files); // { file1: ..., file2: ... }
// });

module.exports = router;
