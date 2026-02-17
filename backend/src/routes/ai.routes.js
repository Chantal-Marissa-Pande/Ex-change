const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

router.get("/recommendations", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT s.id, s.title, s.tags, COUNT(ua.id) AS relevance
      FROM user_activity ua
      JOIN skills s ON s.id = ua.skill_id
      WHERE ua.user_id = $1
      GROUP BY s.id
      ORDER BY relevance DESC
      LIMIT 5
      `,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

module.exports = router;