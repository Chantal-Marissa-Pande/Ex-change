import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import exchangeRoutes from "./routes/exchange.routes.js";
import messageRoutes from "./routes/messages.routes.js";
import ratingRoutes from "./routes/ratings.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import requestsRoutes from "./routes/requests.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/requests", requestsRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

export default app;