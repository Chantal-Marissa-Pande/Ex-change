import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// GET dashboard analytics
router.get("/", async (req, res) => {
  try {
    const usersRes = await pool.query(`SELECT COUNT(*) FROM users`);
    const skillsRes = await pool.query(`SELECT COUNT(*) FROM skills`);
    const exchangesRes = await pool.query(`SELECT COUNT(*) FROM exchanges`);
    const popularSkillsRes = await pool.query(
      `SELECT s.title, COUNT(e.id) AS exchange_count
       FROM exchanges e
       JOIN listings l ON e.listing_id = l.id
       JOIN skills s ON l.skill_id = s.id
       GROUP BY s.title
       ORDER BY exchange_count DESC
       LIMIT 5`
    );

    res.json({
      totalUsers: Number(usersRes.rows[0].count),
      totalSkills: Number(skillsRes.rows[0].count),
      totalExchanges: Number(exchangesRes.rows[0].count),
      popularSkills: popularSkillsRes.rows.map((r) => r.title),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;