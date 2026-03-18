import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ================= GET MESSAGES ================= */
router.get("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;

    const { rows } = await pool.query(
      `SELECT 
        m.id,
        m.exchange_id,
        m.sender_id,
        m.content,
        m.created_at,
        u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.exchange_id = $1
       ORDER BY m.created_at ASC`,
      [exchangeId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default router;