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
      const { exchangeId, sender_id, content } = data;

      if (!content?.trim()) return;

      // Save to DB FIRST
      const result = await pool.query(
        `INSERT INTO messages (exchange_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [exchangeId, sender_id, content]
      );

      const message = result.rows[0];

      // Get sender name
      const userRes = await pool.query(
        `SELECT name FROM users WHERE id=$1`,
        [sender_id]
      );

      message.sender_name = userRes.rows[0].name;

      // Emit to room
      io.to(`exchange_${exchangeId}`).emit("receive_message",{
        ...message
      });
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ---------- Start Server ---------- */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});