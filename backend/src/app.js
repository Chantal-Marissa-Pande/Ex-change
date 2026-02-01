const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/skills", require("./routes/skill.routes"));

app.get("/", (req, res) => res.send("Community Exchange API running"));

module.exports = app;