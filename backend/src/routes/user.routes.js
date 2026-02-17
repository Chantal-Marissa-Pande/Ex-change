const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// -----------------------------
// GET /api/users/me
// -----------------------------
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// GET /api/users/requests
// FIXED (uses exchanges table)
// -----------------------------
router.get("/requests", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM exchanges
      WHERE requester_id = $1
      `,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("REQUESTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// -----------------------------
// GET /api/users/ratings
// -----------------------------
router.get("/ratings", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ratings WHERE rated_user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("RATINGS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

// -----------------------------
// GET /api/users/recommendations
// FIXED (join skill_detail for experience)
// -----------------------------
router.get("/recommendations", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT u.id, u.name,
             COALESCE(AVG(sd.years_experience), 0) AS avg_experience
      FROM users u
      LEFT JOIN skill_detail sd ON u.id = sd.user_id
      WHERE u.id != $1
      GROUP BY u.id
      LIMIT 5
      `,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("RECOMMENDATIONS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// -----------------------------
// Admin: Get all users
// -----------------------------
router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      "SELECT id, name, email, role FROM users"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;