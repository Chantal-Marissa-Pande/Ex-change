const pool = require("../db");

exports.getRecommendations = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT s.id, s.title
      FROM user_activity ua
      JOIN skills s ON ua.skill_id = s.id
      WHERE ua.user_id = $1
      GROUP BY s.id
      ORDER BY COUNT(*) DESC
      LIMIT 5
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recommendation failed" });
  }
};