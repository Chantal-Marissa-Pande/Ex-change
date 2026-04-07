import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    // Totals
    const usersRes = await pool.query(`SELECT COUNT(*) FROM users`);
    const skillsRes = await pool.query(`SELECT COUNT(*) FROM skills`);
    const exchangesRes = await pool.query(`SELECT COUNT(*) FROM exchanges`);

    const totals = {
      users: parseInt(usersRes.rows[0].count),
      skills: parseInt(skillsRes.rows[0].count),
      exchanges: parseInt(exchangesRes.rows[0].count),
    };

    // Status chart
    const rows = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM exchanges
      GROUP BY status
    `);

    const chart = {
      labels: rows.rows.map(r => String (r.status)),
      datasets: [
        {
          label: "Exchanges by status",
          data: rows.rows.map(r => parseInt(r.count)),
          backgroundColor: "#3B82F6",
        }
      ]
    };

    // Monthly chart
    const monthlyRes = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) AS count
      FROM exchanges
      GROUP BY month
      ORDER BY month
    `);

    const monthlyExchanges = {
      labels: monthlyRes.rows.map(r => String(r.month)),
      datasets: [
        {
          label: "Monthly Exchanges",
          data: monthlyRes.rows.map(r => parseInt(r.count)),
          backgroundColor: "#3B82F6"
        }
      ]
    };

    res.json({ totals, chart, monthlyExchanges });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

export default router;