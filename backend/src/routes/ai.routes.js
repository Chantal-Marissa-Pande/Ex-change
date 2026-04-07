import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ================= AI RECOMMENDATIONS ================= */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("AI recommendations for user:", userId);

    /* ================= GET USER SKILL TAGS ================= */
    const userSkills = await pool.query(
      `
      SELECT s.tags
      FROM listings l
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON s.id = sd.skill_id
      WHERE l.user_id = $1
      AND l.status = 'active'
      `,
      [userId]
    );

    let tags = [];

    if (userSkills.rows.length > 0) {
      const tagSet = new Set();

      userSkills.rows.forEach((row) => {
        if (row.tags) {
          try {
            const parsed = JSON.parse(row.tags);
            parsed.forEach((tag) =>
              tagSet.add(tag.trim().toLowerCase())
            );
          } catch {
            row.tags.split(",").forEach((tag) =>
              tagSet.add(tag.trim().toLowerCase())
            );
          }
        }
      });

      tags = Array.from(tagSet);
    }

    console.log("User tags:", tags);

    /* ================= GET VALID LISTINGS ================= */
    const skills = await pool.query(
      `
      SELECT 
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        l.id AS listing_id
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      JOIN listings l ON l.skill_offered_detail_id = sd.id

      WHERE u.id != $1
      AND l.status = 'active'

      -- prevent duplicate requests
      AND NOT EXISTS (
        SELECT 1 FROM exchanges e
        WHERE e.requester_id = $1
        AND e.listing_id = l.id
      )

      ORDER BY l.created_at DESC
      LIMIT 20
      `,
      [userId]
    );

    console.log("Available listings:", skills.rows.length);

    /* ================= SCORING ================= */
    const scored = skills.rows.map((skill) => {
      let score = 0;

      if (tags.length > 0 && skill.tags) {
        try {
          const parsed = JSON.parse(skill.tags);
          parsed.forEach((tag) => {
            if (tags.includes(tag.toLowerCase())) score++;
          });
        } catch {
          skill.tags.split(",").forEach((tag) => {
            if (tags.includes(tag.trim().toLowerCase())) score++;
          });
        }
      }

      return {
        ...skill,
        score,
      };
    });

    /* ================= FALLBACK IF NO TAG MATCH ================= */
    let results = scored;

    const hasScores = scored.some((s) => s.score > 0);

    if (tags.length === 0 || !hasScores) {
      console.log("Using fallback recommendations");
      results = skills.rows.map((s) => ({
        ...s,
        score: 0.5, // neutral score
      }));
    }

    /* ================= NORMALIZE ================= */
    const maxScore = Math.max(...results.map((s) => s.score), 1);

    const normalized = results.map((s) => ({
      ...s,
      score: s.score / maxScore,
    }));

    /* ================= SORT ================= */
    normalized.sort((a, b) => b.score - a.score);

    console.log("Final recommendations:", normalized.length);

    res.json(normalized.slice(0, 5));
  } catch (err) {
    console.error("AI recommendation error:", err);
    res.status(500).json({ message: "AI recommendation failed" });
  }
});

export default router;