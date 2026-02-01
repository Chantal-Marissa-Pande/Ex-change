const pool = require("../config/db");

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id=$1",
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result.rows[0];

    // Fetch skills
    const skillsRes = await pool.query(
      "SELECT skill_offered FROM listings WHERE user_id=$1",
      [userId]
    );
    const skills = skillsRes.rows.map((r) => r.skill_offered);

    res.json({ ...user, skills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};

exports.addSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill } = req.body;

    if (!skill) return res.status(400).json({ message: "Skill is required" });

    await pool.query(
      "INSERT INTO listings (user_id, skill_offered, skill_requested, description) VALUES ($1,$2,'','')",
      [userId, skill]
    );

    // Fetch updated skills
    const skillsRes = await pool.query(
      "SELECT skill_offered FROM listings WHERE user_id=$1",
      [userId]
    );
    const skills = skillsRes.rows.map((r) => r.skill_offered);

    res.json({ skills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add skill", error: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT e.id, u.name AS requester, l.skill_offered AS skill
       FROM exchanges e
       JOIN users u ON e.requester_id = u.id
       JOIN listings l ON e.listing_id = l.id
       WHERE l.user_id = $1 AND e.status = 'pending'`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
};