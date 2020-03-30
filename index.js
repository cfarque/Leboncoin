const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(formidableMiddleware({ multiples: true }));
app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const userRoutes = require("./Routes/user");
app.use(userRoutes);
const offerRoutes = require("./Routes/offer");
app.use(offerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "test route" });
});

app.all("*", (req, res) => {
  res.json({ message: "page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
