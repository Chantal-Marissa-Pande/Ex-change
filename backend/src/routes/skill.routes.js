const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// --------------------
// Get all skills with optional search & tag filter
// --------------------
router.get("/", async (req, res) => {
  const { q = "", tag = "" } = req.query;

  try {
    let query = `
      SELECT 
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        u.name AS owner_name,
        COALESCE(l.exchange_count, 0) AS exchange_count
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON sd.user_id = u.id
      LEFT JOIN (
        SELECT listing_id, COUNT(*) AS exchange_count
        FROM exchanges
        GROUP BY listing_id
      ) l ON l.listing_id = s.id
      WHERE 1=1
    `;

    const params = [];
    if (q) {
      params.push(`%${q}%`);
      query += ` AND s.title ILIKE $${params.length}`;
    }

    if (tag) {
      params.push(`%${tag}%`);
      query += ` AND s.tags ILIKE $${params.length}`;
    }

    const { rows } = await pool.query(query, params);

    const skills = rows.map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags
        ? Array.isArray(s.tags)
          ? s.tags
          : s.tags.split(",").map((t) => t.trim())
        : [],
      owner_id: s.owner_id,
      owner_name: s.owner_name,
      exchange_count: parseInt(s.exchange_count, 10),
    }));

    res.json(skills);
  } catch (err) {
    console.error("GET /skills error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --------------------
// Get single skill by ID
// --------------------
router.get("/:skillId", async (req, res) => {
  const { skillId } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT s.*, u.id AS owner_id, u.name AS owner_name
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON sd.user_id = u.id
      WHERE s.id = $1
      `,
      [skillId]
    );

    if (!rows[0]) return res.status(404).json({ error: "Skill not found" });
    const skill = rows[0];

    skill.tags = skill.tags
      ? Array.isArray(skill.tags)
        ? skill.tags
        : skill.tags.split(",").map((t) => t.trim())
      : [];
    skill.messages = skill.messages || [];
    skill.ratings = skill.ratings || [];

    res.json(skill);
  } catch (err) {
    console.error("GET /skills/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;