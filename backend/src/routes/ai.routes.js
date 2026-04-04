import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ================= AI RECOMMENDATIONS ================= */
router.get("/ai-recommendations", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // GET USER SKILL TAGS (FIXED QUERY)
    const userSkills = await pool.query(`
      SELECT s.tags
      FROM listings l
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON s.id = sd.skill_id
      WHERE l.user_id = $1
    `, [userId]);

    const tagSet = new Set();

    userSkills.rows.forEach(row => {
      if (row.tags) {
        row.tags.split(",").forEach(tag => {
          tagSet.add(tag.trim().toLowerCase());
        });
      }
    });

    const tags = Array.from(tagSet);

    // GET ALL SKILLS (WITH OWNER)
    const skills = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        l.id AS listing_id
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      LEFT JOIN listings l ON l.skill_offered_detail_id = sd.id
      WHERE u.id != $1
    `, [userId]);

    const scored = skills.rows.map(skill => {
      let score = 0;

      if (skill.tags) {
        skill.tags.split(",").forEach(tag => {
          if (tags.includes(tag.trim().toLowerCase())) {
            score++;
          }
        });
      }

      return { ...skill, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 5));

  } catch (err) {
    console.error("AI recommendation error:", err);
    res.status(500).json({ message: "AI recommendation failed" });
  }
});

export default router;