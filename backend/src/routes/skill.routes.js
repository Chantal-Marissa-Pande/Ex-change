import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/*
=====================================================
GET MARKETPLACE LISTINGS
=====================================================
*/
router.get("/", async (req, res) => {
  try {
    const { q = "", tag = "" } = req.query;

    let query = `
      SELECT 
        l.id AS id,
        s.id AS skillId,
        s.title,
        s.tags,
        u.id AS owner_id,
        u.name AS owner_name,
        COUNT(DISTINCT e.id) AS exchange_count
      FROM listings l
      JOIN skill_detail sd ON sd.id = l.skill_offered_detail_id
      JOIN skills s ON s.id = sd.skill_id
      JOIN users u ON u.id = sd.user_id
      LEFT JOIN exchanges e ON e.listing_id = l.id
      WHERE l.status = 'active'
    `;

    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND s.title ILIKE $${params.length}`;
    }

    if (tag) {
      params.push(`%${tag}%`);
      query += ` AND s.tags ILIKE $${params.length}`;
    }

    query += `
      GROUP BY l.id, s.id, u.id
      ORDER BY l.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    res.json(rows);
  } catch (err) {
    console.error("GET /skills error:", err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

/*
=====================================================
GET SINGLE LISTING DETAIL
=====================================================
*/
router.get("/:id", async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id AS id,
        s.id AS skillId,
        s.title,
        s.tags,
        u.id AS owner_id,
        u.name AS owner_name,
        sd.description,
        COUNT(DISTINCT e.id) AS exchange_count
      FROM listings l
      JOIN skill_detail sd ON sd.id = l.skill_offered_detail_id
      JOIN skills s ON s.id = sd.skill_id
      JOIN users u ON u.id = sd.user_id
      LEFT JOIN exchanges e ON e.listing_id = l.id
      WHERE l.id = $1
      GROUP BY l.id, s.id, u.id, sd.description
    `;

    const { rows } = await pool.query(query, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /skills/:id error:", err);
    res.status(500).json({ message: "Error fetching listing" });
  }
});

/*
=====================================================
DELETE LISTING
=====================================================
*/
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