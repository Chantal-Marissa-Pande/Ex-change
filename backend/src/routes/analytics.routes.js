import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* ---------------- Dashboard Analytics ---------------- */
router.get("/", async (req, res) => {
  try {
    // ---------- Basic counts ----------
    const usersRes = await pool.query(`SELECT COUNT(*) FROM users`);
    const skillsRes = await pool.query(`SELECT COUNT(*) FROM skills`);
    const exchangesRes = await pool.query(`SELECT COUNT(*) FROM exchanges`);

    const totalUsers = Number(usersRes.rows[0].count);
    const totalSkills = Number(skillsRes.rows[0].count);
    const totalExchanges = Number(exchangesRes.rows[0].count);

    // ---------- Popular skills ----------
    const popularSkillsRes = await pool.query(`
      SELECT s.title, COUNT(e.id) AS exchange_count
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON sd.skill_id = s.id
      GROUP BY s.title
      ORDER BY exchange_count DESC
      LIMIT 5
    `);

    const skillLabels = popularSkillsRes.rows.map(r => r.title);
    const skillCounts = popularSkillsRes.rows.map(r => Number(r.exchange_count));

    const chartData = {
      labels: skillLabels.length ? skillLabels : ["No Data"],
      datasets: [
        {
          label: "Most Exchanged Skills",
          data: skillCounts.length ? skillCounts : [0],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    // ---------- Monthly exchanges ----------
    const monthlyExchangesRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
      FROM exchanges
      GROUP BY month
      ORDER BY month
    `);

    const monthlyExchangesLabels = monthlyExchangesRes.rows.map(r => r.month);
    const monthlyExchangesCounts = monthlyExchangesRes.rows.map(r => Number(r.count));

    const monthlyExchangesChart = {
      labels: monthlyExchangesLabels.length ? monthlyExchangesLabels : ["No Data"],
      datasets: [
        {
          label: "Exchanges per Month",
          data: monthlyExchangesCounts.length ? monthlyExchangesCounts : [0],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };

    // ---------- Return JSON ----------
    res.json({
      totals: {
        users: totalUsers,
        skills: totalSkills,
        exchanges: totalExchanges,
      },
      chart: chartData,
      monthlyExchanges: monthlyExchangesChart,
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;