import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Chat({ exchangeId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [exchangeId]);

  const fetchMessages = async () => {
    const res = await api.get(`/api/messages/${exchangeId}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    const res = await api.post(`/api/messages/${exchangeId}`, {
      content: text,
    });

    setMessages([...messages, res.data]);
    setText("");
  };

  return (
    <div className="border p-4 rounded">
      <div className="h-60 overflow-y-auto mb-3">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.sender_name}</strong>: {m.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3">
          Send
        </button>
      </div>
    </div>
  );
}