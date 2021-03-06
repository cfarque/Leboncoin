require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.API_STRIPE);
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

const Offer = require("../Models/Offer");
const isAuthenticated = require("../Middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    if (req.files.files) {
      console.log("test");
      let filesTab;
      if (Array.isArray(req.files.files)) {
        filesTab = req.files.files;
      } else {
        filesTab = [req.files.files];
      }
      const pictures = [];
      filesTab.forEach(file => {
        console.log("file", file);
        cloudinary.uploader.upload(file.path, async (error, result) => {
          if (!error) {
            pictures.push(result.secure_url);
          } else {
            res.json({ message: error.message });
            console.log(error);
          }
          if (pictures.length === filesTab.length) {
            const newOffer = new Offer({
              title: req.fields.title,
              description: req.fields.description,
              price: req.fields.price,
              creator: req.user,
              pictures
            });
            await newOffer.save();
            return res.json({
              _id: newOffer._id,
              title: req.fields.title,
              description: req.fields.description,
              price: req.fields.price,
              created: newOffer.created,
              creator: {
                account: newOffer.creator.account,
                _id: newOffer.creator._id
              },
              pictures
            });
          }
        });
      });
    } else {
      const newOffer = new Offer({
        title: req.fields.title,
        description: req.fields.description,
        price: req.fields.price,
        creator: req.user
      });
      await newOffer.save();
      return res.json({
        _id: newOffer._id,
        title: req.fields.title,
        description: req.fields.description,
        price: req.fields.price,
        created: newOffer.created,
        creator: {
          account: newOffer.creator.account,
          _id: newOffer.creator._id
        }
      });
    }
  } catch (error) {
    res.json({ error: error.message });
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
    if (req.query.date === "date-asc") {
      search.sort({ created: 1 });
    } else if (req.query.date === "date-desc") {
      search.sort({ created: -1 });
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
        (newOffer.created = offer.created),
        (newOffer.pictures = offer.pictures),
        (newOffer.username = offer.creator.account.username);
      //
      tab.push(newOffer);
    });

    res.json({ count: count, offers: tab });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("creator");
    res.json(offer);
  } catch (error) {
    res.json("raté");
  }
});

router.post("/payment", async (req, res) => {
  try {
    const response = await stripe.charges.create({
      amount: req.fields.amount * 100,
      currency: "eur",
      description: req.fields.title,
      source: req.fields.token
    });
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
});

module.exports = router;
