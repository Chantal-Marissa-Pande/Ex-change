import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// GET messages for exchange
router.get("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT m.*, u.name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.exchange_id = $1
      ORDER BY m.created_at ASC
      `,
      [exchangeId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// SEND message
router.post("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO messages (exchange_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [exchangeId, userId, content]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;