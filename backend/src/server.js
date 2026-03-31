import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js"; 

dotenv.config();
const PORT = process.env.PORT || 5000;

/* ---------- Create HTTP Server ---------- */
const server = http.createServer(app);

/* ---------- Socket.io Setup ---------- */
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Set();

/* ---------- Socket Events ---------- */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* Join exchange room */
  socket.on("join_exchange", (exchangeId) => {
    socket.join(`exchange_${exchangeId}`);
  });

  /* Join personal room */
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
  });

  /* Track online users */
  socket.on("user_online", (userId) => {
    onlineUsers.add(userId);
    io.emit("online_users", [...onlineUsers]);
  });

  /* MESSAGE FLOW */
  socket.on("send_message", async (data) => {
    try {
      const { exchangeId, sender_id, message } = data;

      if (!exchangeId || !sender_id || !message) return;

      // 1. Save message
      const result = await pool.query(
        `INSERT INTO messages (exchange_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [exchangeId, sender_id, message]
      );

      // 2. Get sender name
      const userRes = await pool.query(
        `SELECT name FROM users WHERE id=$1`,
        [sender_id]
      );

      const sender_name = userRes.rows[0]?.name || "User";

      // 3. Build message payload
      const fullMessage = {
        id: result.rows[0].id,
        exchange_id: exchangeId,
        sender_id,
        sender_name,
        message: result.rows[0].content,
        created_at: result.rows[0].created_at,
      };

      // 4. Emit to exchange room
      io.to(`exchange_${exchangeId}`).emit("receive_message", fullMessage);

    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on("typing", ({exchangeId, userId}) => {
    socket.to(`exchange_${exchangeId}`).emit("user_typing", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


/* ---------- Start Server ---------- */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});