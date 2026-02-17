import express from "express";
const router = express.Router();

// GET /api/analytics
router.get("/", (req, res) => {
  try {
    const data = {
      totalUsers: 120,
      totalSkills: 50,
      totalExchanges: 75,
      popularSkills: ["Coding", "Design", "Cooking"]
    };
    res.json(data);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;