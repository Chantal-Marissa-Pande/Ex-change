// backend/src/routes/user.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// -------------------
// Get current logged-in user
// GET /api/user/me
// -------------------
router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rows.length) return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Get requests for logged-in user
// GET /api/user/requests
// -------------------
router.get("/requests", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `
      SELECT 
        e.id AS exchange_id,
        e.status,
        e.created_at,
        l.description AS listing_description,
        l.skill_offered_id,
        l.skill_requested_id,
        u.id AS requester_id,
        u.name AS requester_name
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN users u ON e.requester_id = u.id
      WHERE l.user_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /requests error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Get a user by ID
// GET /api/user/:userId
// -------------------
router.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rows.length) return res.status(404).json({ message: "User not found" });

    // Fetch the user's skills
    const skillsRes = await pool.query(
      "SELECT s.title, s.tags FROM skills s JOIN user_skills us ON s.id = us.skill_id WHERE us.user_id = $1",
      [userId]
    );

    const skills = skillsRes.rows.map((s) => ({
      ...s,
      tags: s.tags ? s.tags.split(",").map((t) => t.trim()) : [],
    }));

    res.json({ ...result.rows[0], skills });
  } catch (err) {
    console.error("GET /:userId error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Add a skill to logged-in user
// POST /api/user/add-skill
// body: { title, tags }
// -------------------
router.post("/add-skill", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const { title, tags } = req.body;
    if (!title) return res.status(400).json({ message: "Skill title is required" });

    // Insert skill
    const insertSkill = await pool.query(
      "INSERT INTO skills (title, tags) VALUES ($1, $2) RETURNING id, title, tags",
      [title, tags ? tags.join(",") : null]
    );

    const skill = insertSkill.rows[0];

    // Link skill to user
    await pool.query(
      "INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)",
      [userId, skill.id]
    );

    res.json({ message: "Skill added successfully", skill: { ...skill, tags: tags || [] } });
  } catch (err) {
    console.error("POST /add-skill error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;