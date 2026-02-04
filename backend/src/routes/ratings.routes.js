const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// ---------------------------
// GET /api/ratings?skill_id=
// Fetch ratings for a specific skill
// ---------------------------
router.get("/", authenticate, async (req, res) => {
  try {
    const { skill_id } = req.query;
    if (!skill_id) return res.status(400).json({ message: "Skill ID is required" });

    const query = `
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
      FROM ratings r
      JOIN users u ON u.id = r.user_id
      WHERE r.skill_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, [skill_id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch ratings error:", err);
    res.status(500).json({ message: "Failed to fetch ratings" });
  }
});

// ---------------------------
// POST /api/ratings
// Submit a new rating
// ---------------------------
router.post("/", authenticate, async (req, res) => {
  try {
    const { skill_id, rating, comment } = req.body;
    if (!skill_id || !rating) return res.status(400).json({ message: "Skill ID and rating are required" });

    const query = `
      INSERT INTO ratings (skill_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, rating, comment, created_at
    `;

    const result = await pool.query(query, [skill_id, req.user.id, rating, comment || ""]);
    res.json({ ...result.rows[0], user_name: req.user.name });
  } catch (err) {
    console.error("Submit rating error:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

module.exports = router;