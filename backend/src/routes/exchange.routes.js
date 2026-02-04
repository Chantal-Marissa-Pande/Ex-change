const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// POST /api/exchange
router.post("/", authenticate, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const userId = req.user.id;

    if (!listing_id) {
      return res.status(400).json({ message: "Listing ID required" });
    }

    // prevent duplicate requests
    const existing = await pool.query(
      `SELECT id FROM exchanges WHERE requester_id = $1 AND listing_id = $2`,
      [userId, listing_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Request already sent" });
    }

    const result = await pool.query(
      `INSERT INTO exchanges (requester_id, listing_id)
       VALUES ($1, $2)
       RETURNING id, status, created_at`,
      [userId, listing_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Exchange request error:", err);
    res.status(500).json({ message: "Failed to request exchange" });
  }
});

module.exports = router;