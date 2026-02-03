const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// ---------------------------
// GET /api/skill
// Fetch all skills with optional search, mine, tag, and sort
// ---------------------------
router.get("/", authenticate, async (req, res) => {
  try {
    const { q, mine, sort, tag } = req.query;
    const values = [];
    let whereClauses = ["1=1"];

    // Search by skill title
    if (q) {
      values.push(`%${q}%`);
      whereClauses.push(`s.title ILIKE $${values.length}`);
    }

    // Filter by current user's skills
    if (mine === "true") {
      values.push(req.user.id);
      whereClauses.push(`us.user_id = $${values.length}`);
    }

    // Filter by tag
    if (tag) {
      values.push(`%${tag}%`);
      whereClauses.push(`s.tags ILIKE $${values.length}`);
    }

    // Sorting
    let orderBy = "s.created_at DESC"; // default newest
    if (sort === "popular") orderBy = "COALESCE(e.exchange_count, 0) DESC";

    const query = `
      SELECT
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        u.name AS owner_name,
        l.id AS listing_id,
        COALESCE(e.exchange_count, 0) AS exchange_count
      FROM skills s
      JOIN user_skills us ON us.skill_id = s.id
      JOIN users u ON us.user_id = u.id
      LEFT JOIN listings l ON l.skill_offered_id = s.id
      LEFT JOIN (
        SELECT listing_id, COUNT(*) AS exchange_count
        FROM exchanges
        GROUP BY listing_id
      ) e ON e.listing_id = l.id
      WHERE ${whereClauses.join(" AND ")}
      GROUP BY s.id, u.id, l.id, e.exchange_count
      ORDER BY ${orderBy};
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Skills fetch error:", err);
    res.status(500).json({ message: "Failed to fetch skills" });
  }
});

// ---------------------------
// GET /api/skill/:id
// Fetch single skill by ID
// ---------------------------
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        u.name AS owner_name,
        l.id AS listing_id,
        COALESCE(e.exchange_count, 0) AS exchange_count
      FROM skills s
      JOIN user_skills us ON us.skill_id = s.id
      JOIN users u ON us.user_id = u.id
      LEFT JOIN listings l ON l.skill_offered_id = s.id
      LEFT JOIN (
        SELECT listing_id, COUNT(*) AS exchange_count
        FROM exchanges
        GROUP BY listing_id
      ) e ON e.listing_id = l.id
      WHERE s.id = $1
      GROUP BY s.id, u.id, l.id, e.exchange_count;
    `;

    const result = await pool.query(query, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get skill by ID error:", err);
    res.status(500).json({ message: "Failed to fetch skill" });
  }
});

module.exports = router;