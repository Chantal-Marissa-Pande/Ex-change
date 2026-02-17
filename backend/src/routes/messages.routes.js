const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");


// GET MESSAGES
router.get("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT m.*, u.name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.exchange_id = $1
      ORDER BY m.created_at ASC
      `,
      [req.params.exchangeId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});


// SEND MESSAGE
router.post("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content.trim())
      return res.status(400).json({ message: "Message required" });

    const { rows } = await pool.query(
      `
      INSERT INTO messages (exchange_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [req.params.exchangeId, userId, content]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;