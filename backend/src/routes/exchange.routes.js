const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

/* =============================
   CREATE EXCHANGE
============================= */
router.post("/", authenticate, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const userId = req.user.id;

    if (!listing_id)
      return res.status(400).json({ message: "Listing ID required" });

    // Prevent requesting your own listing
    const listingCheck = await pool.query(
      "SELECT user_id FROM listings WHERE id = $1",
      [listing_id]
    );

    if (!listingCheck.rows.length)
      return res.status(404).json({ message: "Listing not found" });

    if (listingCheck.rows[0].user_id === userId)
      return res.status(400).json({ message: "Cannot request your own listing" });

    // Prevent duplicate request
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

/* =============================
   GET MY EXCHANGES
============================= */
router.get("/mine", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT e.*, l.title, l.user_id AS provider_id
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      WHERE e.requester_id = $1 OR l.user_id = $1
      ORDER BY e.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exchanges" });
  }
});

/* =============================
   ACCEPT / REJECT
============================= */
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const exchangeId = req.params.id;
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
        AND e.status = 'pending'
      RETURNING e.*
      `,
      [status, exchangeId, userId]
    );

    if (!result.rows.length)
      return res.status(403).json({ message: "Not authorized or invalid state" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exchange" });
  }
});

/* =============================
   COMPLETE EXCHANGE
============================= */
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
        AND e.status = 'accepted'
      RETURNING e.*
      `,
      [exchangeId, userId]
    );

    if (!result.rows.length)
      return res.status(403).json({ message: "Not authorized or not accepted" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete exchange" });
  }
});

module.exports = router;