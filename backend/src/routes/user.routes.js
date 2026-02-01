const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");
const { getAllUsers } = require("../controllers/user.controller");

router.get("/", auth, admin, getAllUsers);

module.exports = router;