const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Community Exchange API running");
});

/**
 * ROUTES
 */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/skills", require("./routes/skill.routes"));       // ✅ NEW
app.use("/api/requests", require("./routes/skillRequest.routes"));
app.use("/api/exchanges", require("./routes/exchange.routes"));

module.exports = app;