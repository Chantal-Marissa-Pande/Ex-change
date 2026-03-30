import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ================= SUBMIT RATING ================= */
router.post("/:exchangeId", authenticate, async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { score, comment } = req.body;
    const userId = req.user.id;

    // VALIDATION
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: "Score must be between 1 and 5" });
    }

    // CHECK EXCHANGE IS COMPLETED
    const exchangeRes = await pool.query(
      `SELECT e.*, e.provider_id
       FROM exchanges e
       WHERE e.id = $1 AND e.status = 'completed'`,
      [exchangeId]
    );

    if (!exchangeRes.rows.length) {
      return res.status(400).json({ message: "Exchange not completed" });
    }

    const ex = exchangeRes.rows[0];

    // DETERMINE WHO IS BEING RATED
    const ratedUser =
      ex.requester_id === userId
        ? ex.provider_id
        : ex.requester_id;

    // PREVENT DUPLICATE RATINGS
    const existing = await pool.query(
      `SELECT * FROM ratings WHERE exchange_id=$1 AND rater_id=$2`,
      [exchangeId, userId]
    );

    if (existing.rows.length) {
      return res.status(400).json({ message: "Already rated this exchange" });
    }

    // INSERT RATING
    const result = await pool.query(
      `INSERT INTO ratings (exchange_id, rater_id, rated_user_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [exchangeId, userId, ratedUser, score, comment || ""]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

/* ================= GET RECEIVED RATINGS ================= */
router.get("/received", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT r.id, r.score, r.comment, r.created_at,
              u.name AS reviewer
       FROM ratings r
       JOIN users u ON u.id = r.rater_id
       WHERE r.rated_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error("Load ratings error:", err);
    res.status(500).json({ message: "Failed to load ratings" });
  }
});

export default router;