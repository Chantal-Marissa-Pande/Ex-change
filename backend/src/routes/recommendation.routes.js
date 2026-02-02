const express = require("express");
const router = express.Router();
const { getRecommendations } = require("../controllers/recommendations.controller");

router.get("/:userId", getRecommendations);

module.exports = router;