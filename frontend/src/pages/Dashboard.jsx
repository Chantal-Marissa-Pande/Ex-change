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
  const [exchanges, setExchanges] = useState([]);
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

  /* ---------------- Exchanges ---------------- */
  useEffect(() => {
    if (activeTab !== "requests" && activeTab !== "messages") return;
    async function loadExchanges() {
      try {
        const res = await api.get("/requests");
        const { incoming, outgoing } = res.data;
        setExchanges([...incoming, ...outgoing]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load exchanges");
      }
    }
    loadExchanges();
  }, [activeTab]);

  /* ---------------- AI Recommendations ---------------- */
  useEffect(() => {
    if (activeTab !== "recommendations") return;
    async function loadRecommendations() {
      try {
        const res = await api.get("/recommendations");
        setRecommendations(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn("Recommendations not available:", err);
        setRecommendations([]);
        // Optional: show a toast or just display placeholder
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
        setRatings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load ratings");
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
        const data = res.data || {};
        setAnalyticsData({
          totals: data.totals || { users: 0, skills: 0, exchanges: 0 },
          chart: data.chart || { labels: [], datasets: [{ label: "Most Exchanged Skills", data: [] }] },
          monthlyExchanges:
            data.monthlyExchanges || { labels: [], datasets: [{ label: "Exchanges per Month", data: [] }] },
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load analytics");
      }
    }
    loadAnalytics();
  }, [activeTab]);

  /* ---------------- Socket Chat ---------------- */
  useEffect(() => {
    if (!selectedExchange) return;
    socket.emit("join_exchange", selectedExchange);

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedExchange]);

  /* ---------------- Messages ---------------- */
  async function loadMessages(exchangeId) {
    try {
      const res = await api.get(`/messages/${exchangeId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
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
    socket.emit("send_message", msg);
    await api.post(`/messages/${selectedExchange}`, { content: newMessage });
    setNewMessage("");
  }

  /* ---------------- Skills ---------------- */
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

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Welcome {user?.name}</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {["skills", "profile", "requests", "messages", "ratings", "recommendations", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SKILLS */}
        {activeTab === "skills" && (
          <Skills currentUser={user} marketplaceSkills={marketplaceSkills} setMarketplaceSkills={setMarketplaceSkills} />
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow">
            <p>
              <b>Name:</b> {user?.name}
            </p>
            <p>
              <b>Email:</b> {user?.email}
            </p>
            <h3 className="mt-4 font-semibold">My Skills</h3>
            {profileSkills.map((skill) => (
              <div key={skill.id} className="border p-3 mt-2 flex justify-between">
                <div>
                  <b>{skill.title}</b>
                  <p>{skill.description}</p>
                </div>
                <button onClick={() => handleDeleteSkill(skill.id)} className="bg-red-500 text-white px-2 rounded">
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
            <h2 className="font-semibold mb-3">Incoming Requests</h2>
            {exchanges.filter((e) => e.requester_name).length === 0 ? (
              <p>No incoming requests</p>
            ) : (
              exchanges
                .filter((e) => e.requester_name)
                .map((ex) => (
                  <div key={ex.id} className="border p-3 mb-2 flex justify-between">
                    <span><b>Request:</b>{ex.listing_title}</span>
                    <span><b>Requester:</b> {ex.requester_name}</span>
                    {ex.description && <span><b>Details:</b>{ex.description}</span>}
                    <span className="text-gray-500"><b>Status:</b>{ex.status}</span>
                  </div>
                ))
            )}

            <h2 className="font-semibold mb-3 mt-6">Outgoing Requests</h2>
            {exchanges.filter((e) => e.provider_name).length === 0 ? (
              <p>No outgoing requests</p>
            ) : (
              exchanges
                .filter((e) => e.provider_name)
                .map((ex) => (
                  <div key={ex.id} className="border p-3 mb-2 flex justify-between">
                    <span><b>Request:</b> {ex.listing_title}</span>
                    <span><b>Provider:</b> {ex.provider_name}</span>
                    {ex.description && <span><b>Details:</b>{ex.description}</span>}
                    <span className="text-gray-500"><b>Status:</b>{ex.status}</span>
                  </div>
                ))
            )}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded shadow">
            {!selectedExchange ? (
              <>
                <h2 className="font-semibold mb-3">Select an Exchange</h2>
                {exchanges.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => loadMessages(ex.id)}
                    className="block border p-2 w-full text-left mb-2"
                  >
                    Exchange #{ex.id}
                  </button>
                ))}
              </>
            ) : (
              <div>
                <div className="h-64 overflow-y-auto border p-3 mb-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`mb-2 ${m.sender_id === user.id ? "text-right" : ""}`}>
                      <b>{m.sender_name}</b>: {m.content}
                      <small className="text-gray-400 ml-2">{new Date(m.created_at).toLocaleTimeString()}</small>
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
                  <button onClick={sendMessage} className="bg-blue-600 text-white px-4">
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
              <div key={r.id || r.created_at} className="border p-3 mb-2">
                ⭐ {r.score} by <b>{r.reviewer}</b>
                <p>{r.comment}</p>
                <small className="text-gray-400">{new Date(r.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="bg-white p-6 rounded shadow">
            {recommendations.length === 0 ? (
              <p>Recommendations not available yet.</p>
            ) : (
              recommendations.map((skill) => (
                <div key={skill.id} className="border p-3 mb-2">
                  <b>{skill.title}</b>
                  <p className="text-gray-500 text-sm">Tags: {skill.tags}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && analyticsData && (
          <div className="bg-white p-6 rounded shadow space-y-6">
            {/* TOTALS */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-lg font-semibold">Users</p>
                <p className="text-2xl font-bold">{analyticsData?.totals?.users ?? 0}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-lg font-semibold">Skills</p>
                <p className="text-2xl font-bold">{analyticsData?.totals?.skills ?? 0}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-lg font-semibold">Exchanges</p>
                <p className="text-2xl font-bold">{analyticsData?.totals?.exchanges ?? 0}</p>
              </div>
            </div>

            {/* MOST EXCHANGED SKILLS */}
            {analyticsData?.chart?.labels?.length > 0 &&
            Array.isArray(analyticsData.chart.datasets[0]?.data) ? (
              <div>
                <h3 className="font-semibold mb-3">Most Exchanged Skills</h3>
                <Bar
                  data={analyticsData.chart}
                  options={{ responsive: true, plugins: { legend: { position: "top" } } }}
                />
              </div>
            ) : (
              <p>No skill exchange data available.</p>
            )}

            {/* MONTHLY EXCHANGES */}
            {analyticsData?.monthlyExchanges?.labels?.length > 0 &&
            Array.isArray(analyticsData.monthlyExchanges.datasets[0]?.data) ? (
              <div>
                <h3 className="font-semibold mb-3">Exchanges Per Month</h3>
                <Bar
                  data={analyticsData.monthlyExchanges}
                  options={{ responsive: true, plugins: { legend: { position: "top" } } }}
                />
              </div>
            ) : (
              <p>No monthly exchange data available.</p>
            )}
          </div>
        )}

        {activeTab === "analytics" && !analyticsData && <p>Loading analytics...</p>}
      </div>
    </div>
  );
}