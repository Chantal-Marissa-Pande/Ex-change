import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";
import { io } from "../server.js";

const router = express.Router();

// GET messages for a specific exchange
router.get("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;

    const { rows } = await pool.query(
      `SELECT m.*, u.name AS sender_name
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

// POST/send a message
router.post("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) return res.status(400).json({ message: "Message required" });

    const result = await pool.query(
      `INSERT INTO messages (exchange_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [exchangeId, userId, content]
    );

    const message = result.rows[0];

    io.to(`exchange_${exchangeId}`).emit("receiveMessage", message);

    await pool.query(
      `UPDATE exchanges SET message_count = message_count + 1 WHERE id = $1`,
      [exchangeId]
    );

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;