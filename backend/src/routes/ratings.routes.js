import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// Submit rating
router.post("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { score, comment } = req.body;
    const userId = req.user.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: "Score must be between 1 and 5" });
    }

    const exchange = await pool.query(
      `
      SELECT e.*, l.user_id AS provider_id
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      WHERE e.id = $1 AND e.status = 'completed'
      `,
      [exchangeId]
    );

    if (!exchange.rows.length) {
      return res.status(400).json({ message: "Exchange not completed" });
    }

    const ex = exchange.rows[0];

    const ratedUser =
      ex.requester_id === userId ? ex.provider_id : ex.requester_id;

    const result = await pool.query(
      `
      INSERT INTO ratings (exchange_id, rater_id, rated_user_id, score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [exchangeId, userId, ratedUser, score, comment || ""]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

export default router;