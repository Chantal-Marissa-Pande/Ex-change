import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({
      totalUsers: 120,
      totalSkills: 50,
      totalExchanges: 75,
      popularSkills: ["Coding", "Design", "Cooking"],
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;