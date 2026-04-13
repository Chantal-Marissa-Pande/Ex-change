import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ================= AI RECOMMENDATIONS ================= */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("AI recommendations for user:", userId);

    /* ================= GET USER SKILLS ================= */
    const userSkillsResult = await pool.query(
      `
      SELECT s.id, s.tags
      FROM listings l
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON s.id = sd.skill_id
      WHERE l.user_id = $1
      AND l.status = 'active'
      `,
      [userId]
    );

    const userSkillIds = [];
    const tagSet = new Set();

    userSkillsResult.rows.forEach((row) => {
      userSkillIds.push(row.id);

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

    const tags = Array.from(tagSet);

    console.log("User skill IDs:", userSkillIds);
    console.log("User tags:", tags);

    /* ================= GET LISTINGS WITH RATINGS ================= */
    const skills = await pool.query(
      `
      SELECT 
        s.id,
        s.title,
        s.tags,
        u.id AS owner_id,
        l.id AS listing_id,
        l.skill_requested_id,
        l.created_at,
        COALESCE(r.avg_rating, 3) as avg_rating

      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      JOIN listings l ON l.skill_offered_detail_id = sd.id

      LEFT JOIN (
        SELECT rated_user_id, AVG(score) as avg_rating
        FROM ratings
        GROUP BY rated_user_id
      ) r ON r.rated_user_id = u.id

      WHERE u.id != $1
      AND l.status = 'active'

      AND NOT EXISTS (
        SELECT 1 FROM exchanges e
        WHERE e.requester_id = $1
        AND e.listing_id = l.id
      )

      LIMIT 50
      `,
      [userId]
    );

    console.log("Available listings:", skills.rows.length);

    /* ================= SCORING ================= */
    const scored = skills.rows.map((skill) => {
      let score = 0;

      /* ===== TAG MATCH ===== */
      if (tags.length > 0 && skill.tags) {
        try {
          const parsed = JSON.parse(skill.tags);
          const overlap = parsed.filter((tag) =>
            tags.includes(tag.toLowerCase())
          ).length;

          score += overlap * 1.5;
        } catch {
          const parsed = skill.tags.split(",");
          const overlap = parsed.filter((tag) =>
            tags.includes(tag.trim().toLowerCase())
          ).length;

          score += overlap * 1.5;
        }
      }

      /* ===== REQUEST MATCH (VERY IMPORTANT) ===== */
      if (userSkillIds.includes(skill.skill_requested_id)) {
        score += 3;
      }

      /* ===== RATING ===== */
      score += (skill.avg_rating || 3) * 0.5;

      /* ===== RECENCY ===== */
      const ageDays =
        (Date.now() - new Date(skill.created_at)) /
        (1000 * 60 * 60 * 24);

      const recency = Math.max(0, 1 - ageDays / 30);
      score += recency;

      return {
        ...skill,
        score,
      };
    });

    /* ================= FALLBACK ================= */
    const hasScores = scored.some((s) => s.score > 0);

    let results = scored;

    if (!hasScores) {
      console.log("Using fallback recommendations");
      results = scored.map((s) => ({
        ...s,
        score: 0.5,
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