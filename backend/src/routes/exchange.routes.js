const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  requestExchange,
  updateExchange,
  getMyExchanges,
} = require("../controllers/exchange.controller");

router.post("/", auth, requestExchange);
router.put("/:id", auth, updateExchange);
router.get("/mine", auth, getMyExchanges);

module.exports = router;