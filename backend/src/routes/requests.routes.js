import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// GET all incoming and outgoing requests for current user
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const incoming = await pool.query(
      `SELECT e.*, l.title AS listing_title, u.name AS requester_name
       FROM exchanges e
       JOIN listings l ON e.listing_id = l.id
       JOIN users u ON e.requester_id = u.id
       WHERE l.user_id = $1`,
      [userId]
    );

    const outgoing = await pool.query(
      `SELECT e.*, l.title AS listing_title, u.name AS provider_name
       FROM exchanges e
       JOIN listings l ON e.listing_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE e.requester_id = $1`,
      [userId]
    );

    res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
  } catch (err) {
    console.error("Requests error:", err);
    res.status(500).json({ message: "Failed to load requests" });
  }
});

export default router;