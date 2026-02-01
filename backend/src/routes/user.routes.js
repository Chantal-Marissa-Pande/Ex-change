const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");

// GET logged-in user info
router.get("/me", authenticate, async (req, res) => {
  try {
    const userRes = await pool.query(
      "SELECT id, name, email FROM users WHERE id=$1",
      [req.user.id]
    );

    const skillsRes = await pool.query(
      "SELECT title FROM skills WHERE user_id=$1",
      [req.user.id]
    );

    const user = userRes.rows[0];
    user.skills = skillsRes.rows.map((s) => s.title);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// ADD SKILL
router.post("/add-skill", authenticate, async (req, res) => {
  const { skill } = req.body;
  if (!skill) return res.status(400).json({ message: "Skill is required" });

  try {
    await pool.query(
      "INSERT INTO skills (user_id, title) VALUES ($1, $2)",
      [req.user.id, skill]
    );

    const skillsRes = await pool.query(
      "SELECT title FROM skills WHERE user_id=$1",
      [req.user.id]
    );

    res.json({ skills: skillsRes.rows.map((s) => s.title) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add skill" });
  }
});

// GET incoming requests (dummy example)
router.get("/requests", authenticate, async (req, res) => {
  try {
    const requests = [
      { id: 1, requester: "Alice", skill: "Web Development" },
      { id: 2, requester: "Bob", skill: "Plumbing" },
    ];
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// HANDLE request action
router.post("/requests/:id/:action", authenticate, async (req, res) => {
  const { id, action } = req.params;
  if (!["accept", "reject"].includes(action))
    return res.status(400).json({ message: "Invalid action" });

  try {
    // Here you could update exchanges table
    console.log(`User ${req.user.id} ${action} request ${id}`);
    res.json({ message: `Request ${action}ed successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

module.exports = router;