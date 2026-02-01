const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  getListings,
  createListing,
  getMyListings,
} = require("../controllers/listing.controller");

router.get("/", getListings);
router.post("/", auth, createListing);
router.get("/mine", auth, getMyListings);

module.exports = router;