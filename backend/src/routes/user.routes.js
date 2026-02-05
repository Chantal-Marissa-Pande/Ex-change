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
    const userId = Number(req.user.id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Get profile of logged-in user with skills
// GET /api/user/me/profile
// -------------------
router.get("/me/profile", authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Get user info
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );
    if (!userResult.rows.length)
      return res.status(404).json({ message: "User not found" });

    const user = userResult.rows[0];

    // Get user's skills
    const skillsResult = await pool.query(
      `SELECT s.id, s.title, s.tags
       FROM skills s
       JOIN skill_detail sd ON sd.skill_id = s.id
       WHERE sd.user_id = $1`,
      [userId]
    );

    const skills = skillsResult.rows.map((s) => ({
      ...s,
      tags: s.tags ? s.tags.split(",").map((t) => t.trim()) : [],
    }));

    res.json({ ...user, skills });
  } catch (err) {
    console.error("GET /me/profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Get requests for logged-in user
// GET /api/user/requests
// -------------------
router.get("/requests", authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const query = `
      SELECT
        e.id AS exchange_id,
        e.status,
        e.created_at,
        l.id AS listing_id,
        l.description AS listing_description,
        offeredSkill.title AS skill_offered,
        requestedSkill.title AS skill_requested,
        u.id AS requester_id,
        u.name AS requester_name
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills offeredSkill ON sd.skill_id = offeredSkill.id
      JOIN skills requestedSkill ON l.skill_requested_id = requestedSkill.id
      JOIN users u ON e.requester_id = u.id
      WHERE l.user_id = $1
      ORDER BY e.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /requests error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Get incoming & outgoing requests for a user
// GET /api/user/:userId/requests
// -------------------
router.get("/:userId/requests", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid user ID" });

  try {
    // Incoming (you own the listing)
    const incomingQuery = `
      SELECT
        e.id AS exchange_id,
        e.status,
        e.created_at,
        l.description,
        offeredSkill.title AS skill_offered,
        requestedSkill.title AS skill_requested,
        u.id AS requester_id,
        u.name AS requester_name
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills offeredSkill ON sd.skill_id = offeredSkill.id
      JOIN skills requestedSkill ON l.skill_requested_id = requestedSkill.id
      JOIN users u ON e.requester_id = u.id
      WHERE l.user_id = $1
    `;

    // Outgoing (you made the request)
    const outgoingQuery = `
      SELECT
        e.id AS exchange_id,
        e.status,
        e.created_at,
        l.description,
        offeredSkill.title AS skill_offered,
        requestedSkill.title AS skill_requested,
        u.id AS owner_id,
        u.name AS owner_name
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills offeredSkill ON sd.skill_id = offeredSkill.id
      JOIN skills requestedSkill ON l.skill_requested_id = requestedSkill.id
      JOIN users u ON l.user_id = u.id
      WHERE e.requester_id = $1
    `;

    const [incoming, outgoing] = await Promise.all([
      pool.query(incomingQuery, [userId]),
      pool.query(outgoingQuery, [userId]),
    ]);

    res.json({
      incoming: incoming.rows,
      outgoing: outgoing.rows,
    });
  } catch (err) {
    console.error("GET /:userId/requests error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -------------------
// Add a skill for the logged-in user
// POST /api/user/add-skill
// -------------------
router.post("/add-skill", authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { title, tags = [] } = req.body;

    if (!title) return res.status(400).json({ message: "Skill title required" });

    // 1. Insert into skills table
    const skillResult = await pool.query(
      "INSERT INTO skills (title, tags) VALUES ($1, $2) RETURNING id, title, tags",
      [title, tags.join(",")]
    );
    const skill = skillResult.rows[0];

    // 2. Insert into skill_detail to link to user
    await pool.query(
      "INSERT INTO skill_detail (user_id, skill_id) VALUES ($1, $2)",
      [userId, skill.id]
    );

    res.status(201).json({
      message: "Skill added successfully",
      skill: {
        ...skill,
        tags,
      },
    });
  } catch (err) {
    console.error("POST /add-skill error:", err);
    res.status(500).json({ message: "Failed to add skill" });
  }
});

module.exports = router;