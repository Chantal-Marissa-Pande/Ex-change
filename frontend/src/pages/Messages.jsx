import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

const socket = io("http://localhost:5000");

export default function Messages({ exchangeId, currentUser }) {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  /* -------- Load chat history -------- */
  useEffect(() => {

    async function loadMessages() {

      try {

        const res = await api.get(`/messages/${exchangeId}`);
        setMessages(res.data);

      } catch (err) {
        console.error(err);
      }

    }

    loadMessages();

  }, [exchangeId]);

  /* -------- Join socket room -------- */
  useEffect(() => {

    socket.emit("join_exchange", exchangeId);

    socket.on("receive_message", (msg) => {

      if (msg.exchangeId === exchangeId) {
        setMessages((prev) => [...prev, msg]);
      }

    });

    return () => {
      socket.off("receive_message");
    };

  }, [exchangeId]);

  /* -------- Send message -------- */
  async function sendMessage() {

    if (!text.trim()) return;

    try {

      const res = await api.post(`/messages/${exchangeId}`, {
        content: text
      });

      const newMsg = {
        ...res.data,
        exchangeId,
        sender_id: currentUser.id
      };

      socket.emit("send_message", newMsg);

      setMessages((prev) => [...prev, newMsg]);
      setText("");

    } catch (err) {

      console.error(err);

    }

  }

  return (
    <div style={{ padding: "20px" }}>

      <h2>Exchange Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "350px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px"
        }}
      >

        {messages.map((m) => (

          <div
            key={m.id || Math.random()}
            style={{
              textAlign:
                m.sender_id === currentUser.id ? "right" : "left",
              marginBottom: "8px"
            }}
          >

            <b>{m.sender_name || "You"}:</b> {m.content}

          </div>

        ))}

      </div>

      <div style={{ display: "flex", gap: "10px" }}>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}