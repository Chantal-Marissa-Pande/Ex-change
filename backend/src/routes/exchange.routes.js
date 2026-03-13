import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/* ---------------- Create Exchange ---------------- */
router.post("/", authenticate, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const requester_id = req.user.id;
    const result = await pool.query(
      `
      INSERT INTO exchanges (requester_id, listing_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [requester_id, listing_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create exchange error:", err);
    res.status(500).json({ message: "Failed to create exchange" });
  }
});


/* ---------------- Get My Exchanges ---------------- */
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
        s.title AS skill
      FROM exchanges e
      JOIN listings l ON e.listing_id = l.id
      JOIN skill_detail sd ON l.skill_offered_detail_id = sd.id
      JOIN skills s ON sd.skill_id = s.id
      WHERE e.requester_id = $1
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


/* ---------------- Update Exchange Status ---------------- */
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      `
      UPDATE exchanges
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update exchange error:", err);
    res.status(500).json({ message: "Failed to update exchange" });
  }
});

export default router;