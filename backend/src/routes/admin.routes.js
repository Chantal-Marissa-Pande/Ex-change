import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

/* ================= USERS ================= */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STATS ================= */
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, exchanges, listings, completed] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM exchanges"),
      pool.query("SELECT COUNT(*) FROM listings"),
      pool.query(`SELECT COUNT(*) FROM exchanges WHERE status = 'completed'`),
    ]);

    res.json({
      total_users: Number(users.rows[0].count),
      total_exchanges: Number(exchanges.rows[0].count),
      total_listings: Number(listings.rows[0].count),
      completed_exchanges: Number(completed.rows[0].count),
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= EXCHANGES ================= */
router.get("/exchanges", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        u.name AS requester_name,
        e.status,
        e.created_at
      FROM exchanges e
      JOIN users u ON e.requester_id = u.id
      ORDER BY e.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN EXCHANGES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STATUS ANALYTICS ================= */
router.get(
  "/analytics/exchange-status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM exchanges
        GROUP BY status
        ORDER BY count DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("STATUS ANALYTICS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= TOP USERS ================= */
router.get(
  "/analytics/top-users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.name,
          COUNT(e.id)::int AS exchanges_count
        FROM users u
        LEFT JOIN exchanges e ON u.id = e.requester_id
        GROUP BY u.id
        ORDER BY exchanges_count DESC
        LIMIT 5
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("TOP USERS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= TOP SKILLS ================= */
router.get(
  "/analytics/top-skills",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          s.title,
          COUNT(l.id)::int AS usage_count
        FROM listings l
        JOIN skills s ON l.skill_requested_id = s.id
        GROUP BY s.title
        ORDER BY usage_count DESC
        LIMIT 5
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("TOP SKILLS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;