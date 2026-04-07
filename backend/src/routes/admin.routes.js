import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

/* =============================
   GET ALL USERS
============================= */
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, created_at
         FROM users
         ORDER BY id ASC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("ADMIN USERS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* =============================
   DASHBOARD STATS
============================= */
router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [users, exchanges, listings, completed] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM users"),
        pool.query("SELECT COUNT(*) FROM exchanges"),
        pool.query("SELECT COUNT(*) FROM listings"), // ✅ FIXED
        pool.query(
          `SELECT COUNT(*) FROM exchanges WHERE status = 'completed'`
        ), // ✅ NEW
      ]);

      return res.json({
        total_users: Number(users.rows[0].count),
        total_exchanges: Number(exchanges.rows[0].count),
        total_listings: Number(listings.rows[0].count),
        completed_exchanges: Number(completed.rows[0].count), // ✅ FIXED
      });
    } catch (err) {
      console.error("ADMIN STATS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* =============================
   GET ALL EXCHANGES
============================= */
router.get(
  "/exchanges",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
            e.id,
            u.name AS requester_name,
            e.status,
            e.created_at
         FROM exchanges e
         JOIN users u ON e.requester_id = u.id
         ORDER BY e.created_at DESC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("ADMIN EXCHANGES ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* =============================
   EXCHANGE STATUS ANALYTICS
============================= */
router.get(
  "/analytics/exchange-status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM exchanges
         GROUP BY status
         ORDER BY count DESC`
      );

      return res.json(result.rows);
    } catch (err) {
      console.error("ADMIN EXCHANGE STATUS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;