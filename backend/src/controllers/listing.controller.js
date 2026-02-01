const pool = require("../config/db");

exports.getListings = async (req, res) => {
  const listings = await pool.query(
    `SELECT listings.*, users.name AS owner
     FROM listings
     JOIN users ON listings.owner_id = users.id`
  );
  res.json(listings.rows);
};

exports.createListing = async (req, res) => {
  const { title, description, category, type } = req.body;

  const listing = await pool.query(
    `INSERT INTO listings (title, description, category, type, owner_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [title, description, category, type, req.user.id]
  );

  res.status(201).json(listing.rows[0]);
};

exports.getMyListings = async (req, res) => {
  const listings = await pool.query(
    "SELECT * FROM listings WHERE owner_id=$1",
    [req.user.id]
  );
  res.json(listings.rows);
};