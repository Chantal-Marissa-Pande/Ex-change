const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

// Create exchange request
router.post("/", authenticate, async (req, res) => {
  const { listing_id } = req.body;

  if (!listing_id) {
    return res.status(400).json({ message: "Listing ID required" });
  }

  try {
    // Prevent duplicate requests
    const exists = await pool.query(
      `SELECT id FROM exchanges 
       WHERE requester_id = $1 AND listing_id = $2`,
      [req.user.id, listing_id]
    );

    if (exists.rows.length) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const result = await pool.query(
      `INSERT INTO exchanges (requester_id, listing_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, listing_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create exchange" });
  }
});

module.exports = router;