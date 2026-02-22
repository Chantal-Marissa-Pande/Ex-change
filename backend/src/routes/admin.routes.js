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
        "SELECT id, name, email, role FROM users ORDER BY id ASC"
      );

      return res.json(result.rows); // must return array
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
      const skills = await pool.query("SELECT COUNT(*) FROM skill_detail");

      return res.json({
        totalUsers: Number(users.rows[0].count),
        totalExchanges: Number(exchanges.rows[0].count),
        totalSkills: Number(skills.rows[0].count),
      });
    } catch (err) {
      console.error("ADMIN STATS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;