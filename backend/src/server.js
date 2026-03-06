import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

/* ---------- Create HTTP Server ---------- */
const server = http.createServer(app);

/* ---------- Socket.io Setup ---------- */
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

/* ---------- Socket Events ---------- */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join exchange room
  socket.on("join_exchange", (exchangeId) => {
    socket.join(`exchange_${exchangeId}`);
  });

  // Send chat message
  socket.on("send_message", (data) => {
    io.to(`exchange_${data.exchangeId}`).emit("receive_message", data);
  });

  // Exchange status update
  socket.on("update_exchange_status", (data) => {
    io.emit("exchange_status_updated", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ---------- Start Server ---------- */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});