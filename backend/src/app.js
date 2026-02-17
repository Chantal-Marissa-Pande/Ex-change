const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const skillRoutes = require("./routes/skill.routes");
const exchangeRoutes = require("./routes/exchange.routes");
const messageRoutes = require("./routes/messages.routes");
const ratingRoutes = require("./routes/ratings.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");;

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;