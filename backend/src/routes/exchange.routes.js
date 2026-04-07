console.log("Loading exchange routes...");

import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";
import { io } from "../server.js";

const router = express.Router();

/* ================= CREATE EXCHANGE ================= */
router.post("/", authenticate, async (req, res) => {
  console.log("POST /api/exchanges hit");

  try {
    const { listing_id, message } = req.body;
    const requester_id = req.user.id;

    if (!listing_id || isNaN(Number(listing_id))) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    // Get listing owner (provider)
    const listingRes = await pool.query(
      `SELECT l.id, l.user_id, l.status, s.title AS skill_title
       FROM listings l
       JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
       JOIN skills s ON sd.skill_id = s.id
       WHERE l.id = $1`,
      [listing_id]
    );

    if (!listingRes.rows.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = listingRes.rows[0];
    const provider_id = listing.user_id;

    // Only allow active listings
    if (listing.status !== 'active') {
      return res.status(400).json({ message: "Listing is not active" });
    }

    // Prevent requesting own listing
    if (provider_id === requester_id) {
      return res.status(400).json({ message: "Cannot request your own skill" });
    }

    // Prevent duplicate request
    const existing = await pool.query(
      `SELECT 1 FROM exchanges WHERE requester_id = $1 AND listing_id = $2`,
      [requester_id, listing_id]
    );

    if (existing.rows.length) {
      return res.status(400).json({ message: "Request already exists" });
    }

    // Insert new exchange
    const exchangeRes = await pool.query(
      `INSERT INTO exchanges (requester_id, provider_id, listing_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [requester_id, provider_id, listing_id]
    );

    const exchange = exchangeRes.rows[0];

    // Optional first message
    if (message && message.trim()) {
      await pool.query(
        `INSERT INTO messages (exchange_id, sender_id, content)
         VALUES ($1, $2, $3)`,
        [exchange.id, requester_id, message]
      );
    }

    // Build full exchange payload to return
    const fullExchangeRes = await pool.query(
      `SELECT 
         e.id,
         e.status,
         e.created_at,
         l.id AS listing_id,
         s.title AS skill,
         u1.name AS requester_name,
         u2.name AS provider_name,
         e.requester_id,
         e.provider_id
       FROM exchanges e
       JOIN listings l ON e.listing_id = l.id
       JOIN users u1 ON u1.id = e.requester_id
       JOIN users u2 ON u2.id = e.provider_id
       JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
       JOIN skills s ON sd.skill_id = s.id
       WHERE e.id = $1`,
      [exchange.id]
    );

    const fullExchange = fullExchangeRes.rows[0];

    // Emit socket events
    io.to(`user_${provider_id}`).emit("new_request", fullExchange);
    io.to(`user_${requester_id}`).emit("request_sent", fullExchange);

    console.log("Exchange created:", fullExchange);
    res.status(201).json(fullExchange);

  } catch (err) {
    console.error("Create exchange error:", err);
    res.status(500).json({ message: "Failed to create exchange" });
  }
});

/* ================= MY EXCHANGES ================= */
router.get("/my", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT 
        e.id,
        e.status,
        e.created_at,
        l.id AS listing_id,
        s.title AS skill,
        u1.name AS requester_name,
        u2.name AS provider_name,
        e.requester_id,
        e.provider_id,
        r.id AS rating_id
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN users u1 ON u1.id = e.requester_id
      JOIN users u2 ON u2.id = e.provider_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON sd.skill_id = s.id
      LEFT JOIN ratings r
        ON r.exchange_id = e.id
        AND r.rater_id = $1
      WHERE e.requester_id = $1 OR e.provider_id = $1
      ORDER BY e.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Load exchanges error:", err);
    res.status(500).json({ message: "Failed to load exchanges" });
  }
});

/* ================= UPDATE STATUS ================= */
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const exchangeRes = await pool.query(
      `SELECT * FROM exchanges WHERE id = $1`,
      [id]
    );

    if (!exchangeRes.rowCount) {
      return res.status(404).json({ message: "Exchange not found" });
    }

    const exchange = exchangeRes.rows[0];

    // Only provider can accept/reject
    if (status === "accepted" || status === "rejected") {
      if (exchange.provider_id !== userId) {
        return res.status(403).json({ message: "Only provider can accept or reject" });
      }
    }

    // Allow requester to cancel
    if (status === "cancelled") {
      if (exchange.requester_id !== userId) {
        return res.status(403).json({ message: "Only requester can cancel" });
      }
    }

    const updateRes = await pool.query(
      `UPDATE exchanges
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const updatedExchange = updateRes.rows[0];

    // Emit real-time update to both users
    io.to(`user_${updatedExchange.provider_id}`).emit("exchange_updated", updatedExchange);
    io.to(`user_${updatedExchange.requester_id}`).emit("exchange_updated", updatedExchange);

    console.log("Exchange status updated:", updatedExchange);
    res.json(updatedExchange);

  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;