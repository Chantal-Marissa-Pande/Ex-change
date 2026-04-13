import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

/* ================= USERS ================= */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, status, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CREATE USER ================= */
router.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const bcrypt = await import("bcryptjs");

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING id, name, email, role, status
      `,
      [name, email, hashedPassword, role || "user"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= USER STATUS (ACTIVATE / DEACTIVATE) ================= */
router.patch(
  "/users/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "suspended"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await pool.query(
        `UPDATE users SET status = $1 WHERE id = $2`,
        [status, req.params.id]
      );

      res.json({ message: "User status updated" });
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= DELETE USER ================= */
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [
        req.params.id,
      ]);

      res.json({ message: "User deleted" });
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= STATS ================= */
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, exchanges, listings, completed] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM exchanges"),
      pool.query("SELECT COUNT(*) FROM listings"),
      pool.query(
        `SELECT COUNT(*) FROM exchanges WHERE status = 'completed'`
      ),
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

/* ================= ANALYTICS ================= */
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