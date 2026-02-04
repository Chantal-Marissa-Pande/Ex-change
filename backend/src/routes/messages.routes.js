const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// ---------------------------
// GET /api/messages?skill_id=
// Fetch messages for a specific skill
// ---------------------------
router.get("/", authenticate, async (req, res) => {
  try {
    const { skill_id } = req.query;
    if (!skill_id) return res.status(400).json({ message: "Skill ID is required" });

    const query = `
      SELECT m.id, m.content, m.created_at, u.name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.skill_id = $1
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [skill_id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ---------------------------
// POST /api/messages
// Send a new message
// ---------------------------
router.post("/", authenticate, async (req, res) => {
  try {
    const { skill_id, content } = req.body;
    if (!skill_id || !content) return res.status(400).json({ message: "Skill ID and content are required" });

    const query = `
      INSERT INTO messages (skill_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `;

    const result = await pool.query(query, [skill_id, req.user.id, content]);
    res.json({ ...result.rows[0], sender_name: req.user.name });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;