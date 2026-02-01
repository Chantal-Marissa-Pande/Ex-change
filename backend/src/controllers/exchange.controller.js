const pool = require("../config/db");

/**
 * Request an exchange
 */
exports.requestExchange = async (req, res) => {
  try {
    const { listing_id } = req.body;

    // Check listing exists
    const listingResult = await pool.query(
      "SELECT owner_id, status FROM listings WHERE id=$1",
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = listingResult.rows[0];

    // Cannot exchange own listing
    if (listing.owner_id === req.user.id) {
      return res.status(403).json({ message: "Cannot exchange your own listing" });
    }

    // Cannot exchange unavailable listing
    if (listing.status !== "available") {
      return res.status(400).json({ message: "Listing not available" });
    }

    const exchange = await pool.query(
      `INSERT INTO exchanges (requester_id, listing_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, listing_id]
    );

    res.status(201).json(exchange.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update exchange status (accept/reject/complete)
 * Only listing owner allowed
 */
exports.updateExchange = async (req, res) => {
  try {
    const { status } = req.body;

    // Fetch exchange + listing owner
    const result = await pool.query(
      `SELECT exchanges.*, listings.owner_id
       FROM exchanges
       JOIN listings ON exchanges.listing_id = listings.id
       WHERE exchanges.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" });
    }

    const exchange = result.rows[0];

    // Only listing owner can update
    if (exchange.owner_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedExchange = await pool.query(
      "UPDATE exchanges SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    // If accepted → mark listing as exchanged
    if (status === "accepted") {
      await pool.query(
        "UPDATE listings SET status='exchanged' WHERE id=$1",
        [exchange.listing_id]
      );
    }

    res.json(updatedExchange.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get current user's exchanges
 */
exports.getMyExchanges = async (req, res) => {
  try {
    const exchanges = await pool.query(
      `SELECT exchanges.*, listings.title
       FROM exchanges
       JOIN listings ON exchanges.listing_id = listings.id
       WHERE requester_id=$1`,
      [req.user.id]
    );

    res.json(exchanges.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};