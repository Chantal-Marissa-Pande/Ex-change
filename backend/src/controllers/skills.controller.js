const pool = require("../db");

exports.searchSkills = async (req, res) => {
  const { q } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT id, title, description
      FROM skills
      WHERE title ILIKE $1
      LIMIT 10
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};