const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// =======================
// GET ALL SKILLS
// =======================
router.get("/", async (req, res) => {
  try {
    const { q = "", tag = "" } = req.query;

    let query = `
      SELECT s.id, s.title, s.tags,
             u.id AS owner_id,
             u.name AS owner_name
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
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

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch skills" });
  }
});


// =======================
// GET SINGLE SKILL
// =======================
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, u.name AS owner_name
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      WHERE s.id = $1
    `, [req.params.id]);

    if (!rows.length)
      return res.status(404).json({ message: "Skill not found" });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching skill" });
  }
});

module.exports = router;