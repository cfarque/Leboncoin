const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(cors());
require("dotenv").config();
const app = express();
app.use(formidableMiddleware());

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
  res.json({ messgae: "test route" });
});

app.all("*", (req, res) => {
  res.json({ message: "page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
