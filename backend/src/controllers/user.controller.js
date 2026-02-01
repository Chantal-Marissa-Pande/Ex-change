const pool = require("../config/db");

exports.getAllUsers = async (req, res) => {
  const users = await pool.query(
    "SELECT id, name, email, role FROM users"
  );
  res.json(users.rows);
};