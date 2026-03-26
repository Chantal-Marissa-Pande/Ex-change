import { useEffect, useState } from "react";
import socket from "../socket";
import api from "../api/axios";

export default function Messages({ exchangeId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  /* LOAD HISTORY */
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

  /* SOCKET */
  useEffect(() => {
    socket.emit("join_exchange", exchangeId);

    const handler = (msg) => {
      if (
        msg.exchangeId === exchangeId ||
        msg.exchange_id === exchangeId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handler);

    return () => socket.off("receive_message", handler);
  }, [exchangeId]);

  /* SEND */
  async function sendMessage() {
    if (!text.trim()) return;

    try {
      await api.post(`/messages/${exchangeId}`, {
        content: text,
      });
      setText("");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-4">
      <div className="border h-[350px] overflow-y-auto p-3 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex mb-2 ${
              m.sender_id === currentUser.id
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded max-w-xs ${
                m.sender_id === currentUser.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <div className="text-xs opacity-70">
                {m.sender_name || "User"}
              </div>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border flex-1 p-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}