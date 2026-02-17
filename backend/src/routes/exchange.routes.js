const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");


// =============================
// CREATE EXCHANGE
// =============================
router.post("/", authenticate, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const userId = req.user.id;

    if (!listing_id)
      return res.status(400).json({ message: "Listing ID required" });

    // Prevent duplicate
    const existing = await pool.query(
      `SELECT id FROM exchanges
       WHERE requester_id = $1 AND listing_id = $2`,
      [userId, listing_id]
    );

    if (existing.rows.length)
      return res.status(409).json({ message: "Request already sent" });

    const { rows } = await pool.query(
      `INSERT INTO exchanges (requester_id, listing_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, listing_id]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create exchange" });
  }
});


// =============================
// ACCEPT / REJECT
// =============================
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const exchangeId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const result = await pool.query(
      `
      UPDATE exchanges e
      SET status = $1
      FROM listings l
      WHERE e.id = $2
        AND e.listing_id = l.id
        AND l.user_id = $3
      RETURNING e.*
      `,
      [status, exchangeId, userId]
    );

    if (!result.rows.length)
      return res.status(403).json({ message: "Not authorized" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exchange" });
  }
});


// =============================
// COMPLETE EXCHANGE
// =============================
router.patch("/:id/complete", authenticate, async (req, res) => {
  try {
    const exchangeId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `
      UPDATE exchanges e
      SET status = 'completed'
      FROM listings l
      WHERE e.id = $1
        AND e.listing_id = l.id
        AND (e.requester_id = $2 OR l.user_id = $2)
      RETURNING e.*
      `,
      [exchangeId, userId]
    );

    if (!result.rows.length)
      return res.status(403).json({ message: "Not authorized" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete exchange" });
  }
});


// =============================
// RATE EXCHANGE
// =============================
router.post("/:id/rate", authenticate, async (req, res) => {
  try {
    const exchangeId = req.params.id;
    const { score, comment } = req.body;
    const userId = req.user.id;

    const exchange = await pool.query(
      `
      SELECT e.*, l.user_id AS provider_id
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      WHERE e.id = $1 AND e.status = 'completed'
      `,
      [exchangeId]
    );

    if (!exchange.rows.length)
      return res.status(400).json({ message: "Exchange not completed" });

    const ex = exchange.rows[0];

    const ratedUser =
      ex.requester_id === userId ? ex.provider_id : ex.requester_id;

    const result = await pool.query(
      `
      INSERT INTO ratings (exchange_id, rater_id, rated_user_id, score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [exchangeId, userId, ratedUser, score, comment]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

module.exports = router;