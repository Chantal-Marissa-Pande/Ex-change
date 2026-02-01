const express = require("express");
const router = express.Router();
const { getMe, addSkill, getRequests } = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/me", authMiddleware, getMe);
router.post("/add-skill", authMiddleware, addSkill);
router.get("/requests", authMiddleware, getRequests); // NEW route

module.exports = router;