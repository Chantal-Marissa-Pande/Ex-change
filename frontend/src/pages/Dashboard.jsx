import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import Skills from "./Skills";
import AddSkillForm from "./AddSkillForm";
import socket from "../socket";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const messageEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profileSkills, setProfileSkills] = useState([]);
  const [marketplaceSkills, setMarketplaceSkills] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);

  /* ---------------- Load Dashboard ---------------- */
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get("/users/me");
        const userData = res.data;
        setUser(userData);
        setProfileSkills(userData.skills || []);

        const marketplace = await api.get("/skills");
        setMarketplaceSkills(marketplace.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  /* ---------------- Requests ---------------- */
  useEffect(() => {
    if (activeTab !== "requests") return;
    async function loadRequests() {
      try {
        const res = await api.get("/requests");
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadRequests();
  }, [activeTab]);

  /* ---------------- AI Recommendations ---------------- */
  useEffect(() => {
    if (activeTab !== "recommendations") return;
    async function loadRecommendations() {
      try {
        const res = await api.get("/ai/recommendations");
        setRecommendations(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadRecommendations();
  }, [activeTab]);

  /* ---------------- Ratings ---------------- */
  useEffect(() => {
    if (activeTab !== "ratings") return;
    async function loadRatings() {
      try {
        const res = await api.get("/ratings/received");
        setRatings(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadRatings();
  }, [activeTab]);

  /* ---------------- Analytics ---------------- */
  useEffect(() => {
    if (activeTab !== "analytics") return;
    async function loadAnalytics() {
      try {
        const res = await api.get("/analytics");
        setAnalyticsData(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadAnalytics();
  }, [activeTab]);

  /* ---------------- Socket Setup & Messages ---------------- */
  useEffect(() => {
    if (!selectedExchange) return;

    // Join the exchange room
    socket.emit("join_exchange", selectedExchange);

    // Listen for incoming messages
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Scroll to bottom on new message
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on("receive_message", handleReceiveMessage);

    // Handle reconnect: rejoin the room automatically
    const handleReconnect = () => {
      if (selectedExchange) {
        socket.emit("join_exchange", selectedExchange);
      }
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("connect", handleReconnect);
    };
  }, [selectedExchange]);

  /* ---------------- Messages ---------------- */
  async function loadMessages(exchangeId) {
    try {
      const res = await api.get(`/messages/${exchangeId}`);
      setMessages(res.data);
      setSelectedExchange(exchangeId);
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      toast.error("Failed to load messages");
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const msg = {
      exchangeId: selectedExchange,
      content: newMessage,
      sender_id: user.id,
    };

    // Emit to backend
    socket.emit("send_message", msg);

    // Persist in DB
    await api.post(`/messages/${selectedExchange}`, { content: newMessage });

    setNewMessage("");
  }

  /* ---------------- Skill Delete ---------------- */
  async function handleDeleteSkill(id) {
    try {
      await api.delete(`/users/skills/${id}`);
      setProfileSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  function handleAddSkill(skill) {
    setProfileSkills((prev) => [skill, ...prev]);
  }

  /* ---------------- Logout ---------------- */
  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Welcome {user?.name}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            "skills",
            "profile",
            "requests",
            "messages",
            "ratings",
            "recommendations",
            "analytics",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* MARKETPLACE */}
        {activeTab === "skills" && (
          <Skills
            currentUser={user}
            marketplaceSkills={marketplaceSkills}
            setMarketplaceSkills={setMarketplaceSkills}
          />
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow">
            <p>
              <b>Name:</b> {user.name}
            </p>
            <p>
              <b>Email:</b> {user.email}
            </p>
            <h3 className="mt-4 font-semibold">My Skills</h3>

            {profileSkills.map((skill) => (
              <div key={skill.id} className="border p-3 mt-2 flex justify-between">
                <div>
                  <b>{skill.title}</b>
                  <p>{skill.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="bg-red-500 text-white px-2 rounded"
                >
                  Delete
                </button>
              </div>
            ))}

            <div className="mt-4">
              <AddSkillForm currentUser={user} onSkillAdded={handleAddSkill} />
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-3">Incoming</h2>
            {requests.incoming.map((r) => (
              <div key={r.id}>{r.title}</div>
            ))}
            <h2 className="font-semibold mt-4 mb-3">Outgoing</h2>
            {requests.outgoing.map((r) => (
              <div key={r.id}>{r.title}</div>
            ))}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded shadow">
            {!selectedExchange && (
              <div>
                <h2 className="font-semibold mb-3">Select an Exchange</h2>
                {requests.outgoing.concat(requests.incoming).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => loadMessages(ex.id)}
                    className="block border p-2 w-full text-left mb-2"
                  >
                    Exchange #{ex.id}
                  </button>
                ))}
              </div>
            )}

            {selectedExchange && (
              <div>
                <div className="h-64 overflow-y-auto border p-3 mb-3">
                  {messages.map((m) => (
                    <div key={m.id} className="mb-2">
                      <b>{m.sender_name}</b>: {m.content}
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
            )}
          </div>
        )}

        {/* RATINGS */}
        {activeTab === "ratings" && (
          <div className="bg-white p-6 rounded shadow">
            {ratings.map((r) => (
              <div key={r.id} className="border p-3 mb-2">
                ⭐ {r.score}
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="bg-white p-6 rounded shadow">
            {recommendations.map((skill) => (
              <div key={skill.id} className="border p-3 mb-2">
                {skill.title}
              </div>
            ))}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded shadow">
            {analyticsData ? <Bar data={analyticsData} /> : <p>No analytics yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}