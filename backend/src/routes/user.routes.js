const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// Get current user profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = result.rows[0];

    // Fetch user skills
    const skillsRes = await pool.query(
      "SELECT s.title FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1",
      [req.user.id]
    );

    user.skills = skillsRes.rows.map((r) => r.title);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Get incoming requests
router.get("/requests", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, u.name as requester, s.title as skill
       FROM exchanges e
       JOIN users u ON e.requester_id = u.id
       JOIN listings l ON e.listing_id = l.id
       JOIN skills s ON l.skill_offered_id = s.id
       WHERE l.user_id = $1 AND e.status='pending'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// Process request (accept/reject)
router.post("/requests/:id/:action", authenticate, async (req, res) => {
  const { id, action } = req.params;
  if (!["accept", "reject"].includes(action))
    return res.status(400).json({ message: "Invalid action" });

  try {
    await pool.query("UPDATE exchanges SET status=$1 WHERE id=$2", [
      action,
      id,
    ]);
    res.json({ message: `Request ${action}ed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// Get top recommended skills (AI personalization)
router.get("/recommendations", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title
       FROM user_activity ua
       JOIN skills s ON ua.skill_id = s.id
       WHERE ua.user_id = $1
       GROUP BY s.id
       ORDER BY COUNT(*) DESC
       LIMIT 5`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

module.exports = router;