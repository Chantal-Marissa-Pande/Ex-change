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
        "SELECT id, name, email, role, created_at FROM users ORDER BY id ASC"
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
      const users = await pool.query("SELECT COUNT(*) FROM users");
      const exchanges = await pool.query("SELECT COUNT(*) FROM exchanges");
      const listings = await pool.query("SELECT COUNT(*) FROM skill_detail");

      return res.json({
        total_users: Number(users.rows[0].count),
        total_exchanges: Number(exchanges.rows[0].count),
        total_listings: Number(listings.rows[0].count),
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
        `SELECT e.id, u.name AS requester_name, e.status, e.created_at
         FROM exchanges e
         JOIN users u ON e.requester_id = u.id
         ORDER BY e.id ASC`
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
        `SELECT status, COUNT(*) AS count
         FROM exchanges
         GROUP BY status`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("ADMIN EXCHANGE STATUS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;