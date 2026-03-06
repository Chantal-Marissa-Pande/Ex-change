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
      VALUES ($1,$2)
      RETURNING *
      `,
      [requester_id, listing_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to create exchange" });

  }
});

/* ---------------- Get My Exchanges ---------------- */
router.get("/my", authenticate, async (req, res) => {

  try {

    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT e.*, l.title
      FROM exchanges e
      JOIN listings l ON l.id = e.listing_id
      WHERE e.requester_id = $1
      ORDER BY e.created_at DESC
      `,
      [userId]
    );

    res.json(rows);

  } catch (err) {

    console.error(err);
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

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to update exchange" });

  }

});

router.put("/:id/status", authenticate, async (req, res) => {
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

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to update exchange" });

  }

});

export default router;