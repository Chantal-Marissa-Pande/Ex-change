const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, title: "Web Development", owner_name: "John Doe" },
    { id: 2, title: "Plumbing", owner_name: "Jane Smith" },
    { id: 3, title: "Graphic Design", owner_name: "Alex Kim" },
  ]);
});

module.exports = router;