import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";
import { io } from "../server.js";

const router = express.Router();

/* ================= CREATE EXCHANGE ================= */
router.post("/", authenticate, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const requester_id = req.user.id;

    if (!listing_id) {
      return res.status(400).json({ message: "Listing ID required" });
    }

    const listingRes = await pool.query(
      `SELECT user_id FROM listings WHERE id=$1`,
      [listing_id]
    );

    if (!listingRes.rows.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const provider_id = listingRes.rows[0].user_id;

    // Prevent requesting your own listing
    if (provider_id === requester_id) {
      return res.status(400).json({ message: "Cannot request your own skill" });
    }

    const result = await pool.query(
      `INSERT INTO exchanges (requester_id, listing_id, status)
       VALUES ($1,$2,'pending')
       RETURNING *`,
      [requester_id, listing_id]
    );

    const exchange = result.rows[0];

    /* 🔔 Notify provider */
    io.to(`user_${provider_id}`).emit("new_request", exchange);

    res.status(201).json(exchange);
  } catch (err) {
    console.error("Create exchange error:", err);
    res.status(500).json({ message: "Failed to create exchange" });
  }
});

/* ================= MY EXCHANGES (SENT + RECEIVED) ================= */
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
        l.user_id AS provider_id
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN users u1 ON u1.id = e.requester_id
      JOIN users u2 ON u2.id = l.user_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON sd.skill_id = s.id
      WHERE e.requester_id = $1 OR l.user_id = $1
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

/* ================= REQUESTS RECEIVED ================= */
router.get("/requests", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT 
        e.id,
        e.status,
        e.created_at,
        s.title AS skill,
        u.name AS requester
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN users u ON u.id = e.requester_id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON sd.skill_id = s.id
      WHERE l.user_id = $1
      ORDER BY e.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Load requests error:", err);
    res.status(500).json({ message: "Failed to load requests" });
  }
});

/* ================= UPDATE STATUS ================= */
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "accepted", "rejected", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      `
      UPDATE exchanges
      SET status=$1
      WHERE id=$2
      RETURNING *
      `,
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Exchange not found" });
    }

    const exchange = result.rows[0];

    /* 🔄 Notify users */
    io.emit("exchange_status_updated", exchange);

    res.json(exchange);
  } catch (err) {
    console.error("Update exchange error:", err);
    res.status(500).json({ message: "Failed to update exchange" });
  }
});

export default router;