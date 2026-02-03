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

app.use("/api/exchange", exchangeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/skill", skillRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;