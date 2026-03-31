const pool = require("../config/db");

exports.getListings = async (req, res) => {
  const listings = await pool.query(
    `SELECT listings.*, users.name AS owner
     FROM listings
     JOIN users ON listings.owner_id = users.id`
  );
  res.json(listings.rows);
};

const pool = require("../config/db");

exports.createListing = async (req, res) => {
  try {
    const { skill_offered_detail_id, skill_requested_id, description } = req.body;
    const userId = req.user.id;

    // VALIDATION (ADD THIS BLOCK)
    const skillDetail = await pool.query(
      "SELECT user_id FROM skill_detail WHERE id = $1",
      [skill_offered_detail_id]
    );

    if (!skillDetail.rows.length) {
      return res.status(404).json({ message: "Skill not found" });
    }

    if (Number(skillDetail.rows[0].user_id) !== Number(userId)) {
      return res.status(403).json({
        message: "You can only list your own skills",
      });
    }

    // CREATE LISTING
    const result = await pool.query(
      `INSERT INTO listings (user_id, skill_offered_detail_id, skill_requested_id, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, skill_offered_detail_id, skill_requested_id, description]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ message: "Failed to create listing" });
  }
};

exports.getMyListings = async (req, res) => {
  const listings = await pool.query(
    "SELECT * FROM listings WHERE owner_id=$1",
    [req.user.id]
  );
  res.json(listings.rows);
};