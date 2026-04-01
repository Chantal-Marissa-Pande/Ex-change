import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/* =====================================================
GET ALL MARKETPLACE LISTINGS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (s.id) 
        s.id,
        s.title,
        s.tags,
        u.name AS owner_name,
        sd.user_id,
        l.id AS listing_id
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      LEFT JOIN listings l ON l.skill_offered_detail_id = sd.id
      ORDER BY s.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET /skills error:", err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

/* =====================================================
GET SINGLE SKILL DETAIL
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.tags,
        u.name AS owner_name,
        l.id AS listing_id
      FROM skills s
      JOIN skill_detail sd ON sd.skill_id = s.id
      JOIN users u ON u.id = sd.user_id
      LEFT JOIN listings l ON l.skill_offered_detail_id = sd.id
      WHERE s.id = $1
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Skill not found" });
    }

    // Ensure listing_id is always present (null if no listing yet)
    const skill = { ...rows[0], listing_id: rows[0].listing_id || null };

    res.json(skill);
  } catch (err) {
    console.error("GET /skills/:id error:", err);
    res.status(500).json({ message: "Error fetching skill" });
  }
});

/* =====================================================
DELETE LISTING
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const listingId = req.params.id;

    if (!listingId || isNaN(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    await pool.query("DELETE FROM listings WHERE id = $1", [listingId]);

    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.error("DELETE /skills/:id error:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
});

export default router;