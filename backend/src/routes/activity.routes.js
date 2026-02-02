const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Track user activity
router.post("/", async (req, res) => {
  const { userId, skillId, action } = req.body;
  if (!userId || !skillId || !action) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await pool.query(
      `INSERT INTO user_activity (user_id, skill_id, action) VALUES ($1, $2, $3)`,
      [userId, skillId, action]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to track activity" });
  }
});

module.exports = router;