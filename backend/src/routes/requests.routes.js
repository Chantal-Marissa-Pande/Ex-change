import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const incoming = await pool.query(
      `SELECT * FROM exchanges WHERE provider_id = $1`,
      [userId]
    );

    const outgoing = await pool.query(
      `SELECT * FROM exchanges WHERE requester_id = $1`,
      [userId]
    );

    res.json({
      incoming: incoming.rows,
      outgoing: outgoing.rows,
    });
  } catch (err) {
    console.error("Requests error:", err);
    res.status(500).json({ message: "Failed to load requests" });
  }
});

export default router;