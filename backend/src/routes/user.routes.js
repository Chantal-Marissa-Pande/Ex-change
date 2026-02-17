import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// --------------------
// GET /api/users/me
// --------------------
router.get("/me", authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = userResult.rows[0];

    const skillsResult = await pool.query(
      `SELECT sd.id AS detail_id, s.id AS skill_id, s.title, s.category, s.tags,
              sd.level, sd.years_experience, sd.description
       FROM skill_detail sd
       JOIN skills s ON s.id = sd.skill_id
       WHERE sd.user_id = $1`,
      [req.user.id]
    );

    // Convert tags to array for frontend
    user.skills = skillsResult.rows.map((s) => ({
      ...s,
      tags: s.tags ? s.tags.split(",").map((t) => t.trim()) : [],
    }));

    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// POST /api/users/skills
// --------------------
router.post("/skills", authenticate, async (req, res) => {
  try {
    const { title, category, level, years_experience, tags, description } = req.body;

    // 1️⃣ Insert skill if it doesn't exist
    const skillResult = await pool.query(
      `INSERT INTO skills (title, category, tags)
       VALUES ($1, $2, $3)
       ON CONFLICT (title) DO UPDATE SET category = EXCLUDED.category
       RETURNING *`,
      [title, category, (Array.isArray(tags) ? tags.join(",") : tags) || ""]
    );
    const skill = skillResult.rows[0];

    // 2️⃣ Insert into skill_detail for this user, prevent duplicates
    const detailResult = await pool.query(
      `INSERT INTO skill_detail (user_id, skill_id, level, years_experience, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, skill_id) 
       DO UPDATE SET level = EXCLUDED.level,
                     years_experience = EXCLUDED.years_experience,
                     description = EXCLUDED.description
       RETURNING *`,
      [req.user.id, skill.id, level, years_experience || 0, description || ""]
    );

    // Combine for frontend
    const combinedSkill = {
      detail_id: detailResult.rows[0].id,
      skill_id: skill.id,
      title: skill.title,
      category: skill.category,
      level: detailResult.rows[0].level,
      years_experience: detailResult.rows[0].years_experience,
      description: detailResult.rows[0].description,
      tags: skill.tags ? skill.tags.split(",").map((t) => t.trim()) : [],
    };

    res.status(201).json(combinedSkill);
  } catch (err) {
    console.error("ADD SKILL ERROR:", err.message);
    res.status(500).json({ error: "Failed to add skill" });
  }
});

// --------------------
// DELETE /api/users/skills/:id
// --------------------
router.delete("/skills/:detailId", authenticate, async (req, res) => {
  try {
    const { detailId } = req.params;

    await pool.query(
      "DELETE FROM skill_detail WHERE id = $1 AND user_id = $2",
      [detailId, req.user.id]
    );

    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    console.error("DELETE SKILL ERROR:", err.message);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

export default router;