const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// PLATFORM STATS
router.get("/stats", authenticate, authorizeAdmin, async (req, res) => {
  const users = await pool.query("SELECT COUNT(*) FROM users");
  const exchanges = await pool.query("SELECT COUNT(*) FROM exchanges");
  const completed = await pool.query(
    "SELECT COUNT(*) FROM exchanges WHERE status='completed'"
  );

  res.json({
    total_users: users.rows[0].count,
    total_exchanges: exchanges.rows[0].count,
    completed_exchanges: completed.rows[0].count,
  });
});

module.exports = router;