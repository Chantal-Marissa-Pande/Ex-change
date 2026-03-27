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
  const [messages, setMessages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  const [selectedExchange, setSelectedExchange] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);

  /* LOAD USER + SKILLS */
  useEffect(() => {
    async function loadDashboard() {
      try {
        const userRes = await api.get("/users/me");
        setUser(userRes.data);
        setProfileSkills(userRes.data.skills || []);

        const skillsRes = await api.get("/skills");
        const filtered = (skillsRes.data || []).filter(
          (s) => s.user_id !== userRes.data.id
        );

        setMarketplaceSkills(filtered);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  /* JOIN USER ROOM */
  useEffect(() => {
    if (!user) return;
    socket.emit("join_user", user.id);
  }, [user]);

  /* LOAD EXCHANGES */
  useEffect(() => {
    if (!["requests", "messages"].includes(activeTab)) return;

    api.get("/exchanges/my")
      .then((res) => setExchanges(res.data || []))
      .catch(() => toast.error("Failed to load exchanges"));
  }, [activeTab]);

  /* LOAD RATINGS */
  useEffect(() => {
    if (activeTab !== "ratings") return;

    api.get("/ratings/received")
      .then((res) => setRatings(res.data || []))
      .catch(() => toast.error("Failed to load ratings"));
  }, [activeTab]);

  /* LOAD RECOMMENDATIONS */
  useEffect(() => {
    if (activeTab !== "recommendations") return;

    async function loadRecommendations() {
      try {
        const res = await api.get("/ai-recommendations");
        setRecommendations(res.data || []);
      } catch {
        toast.error("No AI recommendations");
        setRecommendations([]);
      }
    }

    loadRecommendations();
  }, [activeTab]);

  /* LOAD ANALYTICS */
  useEffect(() => {
    if (activeTab !== "analytics") return;

    api.get("/analytics")
      .then((res) => setAnalyticsData(res.data))
      .catch(() => toast.error("Failed to load analytics"));
  }, [activeTab]);

  /* SOCKET CHAT */
  useEffect(() => {
    if (!selectedExchange) return;

    const receive = (msg) => {
      const normalized = {
        ...msg,
        message: msg.message || msg.content,
      };

      if (
        normalized.exchangeId !== selectedExchange &&
        normalized.exchange_id !== selectedExchange
      )
        return;

      setMessages((prev) => [...prev, normalized]);

      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on("receive_message", receive);
    return () => socket.off("receive_message", receive);
  }, [selectedExchange]);

  /* LOAD MESSAGES */
  async function loadMessages(id) {
    try {
      const res = await api.get(`/messages/${id}`);

      const normalized = (res.data || []).map((m) => ({
        ...m,
        message: m.message || m.content,
      }));

      setMessages(normalized);

      setSelectedExchange(id);
      socket.emit("join_exchange", id);
    } catch {
      toast.error("Failed to load messages");
    }
  }

  /* SEND MESSAGE */
  function sendMessage() {
    if (!newMessage.trim()) return;

    socket.emit("send_message", {
      exchangeId: selectedExchange,
      sender_id: user.id,
      message: newMessage,
    });

    setNewMessage("");
  }

  /* UPDATE STATUS */
  async function updateStatus(id, status) {
    try {
      const res = await api.patch(`/exchanges/${id}/status`, { status });

      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === id ? { ...ex, status: res.data.status } : ex
        )
      );

      toast.success(`Exchange ${status}`);

      if (status === "accepted") {
        setActiveTab("messages");
        loadMessages(id);
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  /* DELETE SKILL */
  async function handleDeleteSkill(id) {
    try {
      await api.delete(`/users/skills/${id}`);
      setProfileSkills((prev) => prev.filter((s) => s.id !== id));
      setMarketplaceSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  /* ADD SKILL */
  function handleAddSkill(skill) {
    setProfileSkills((prev) => [skill, ...prev]);
  }

  /* LOGOUT */
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

        {/* SKILLS */}
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
            <h2 className="font-semibold mb-3">Incoming Requests</h2>
            {exchanges
              .filter((ex) => ex.provider_id === user.id)
              .map((ex) => (
                <div key={ex.id} className="border p-3 mb-2">
                  <p>
                    <b>Skill:</b> {ex.skill}
                  </p>
                  <p>
                    <b>From:</b> {ex.requester_name}
                  </p>
                  <p>
                    <b>Status:</b>{" "}
                    <span
                      className={
                        ex.status === "pending"
                          ? "text-yellow-600"
                          : ex.status === "accepted"
                          ? "text-green-600"
                          : ex.status === "completed"
                          ? "text-blue-600"
                          : "text-red-600"
                      }
                    >
                      {ex.status}
                    </span>
                  </p>

                  {/* ACTION BUTTONS */}
                  {ex.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(ex.id, "accepted")}
                        className="bg-green-500 text-white px-2 mr-2"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(ex.id, "rejected")}
                        className="bg-red-500 text-white px-2"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {ex.status === "accepted" && (
                    <>
                      <button
                        onClick={() => updateStatus(ex.id, "completed")}
                        className="bg-blue-500 text-white px-2 mt-2"
                      >
                        Mark as completed
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("messages");
                          loadMessages(ex.id);
                        }}
                        className="bg-gray-700 text-white px-2 mt-2"
                      >
                        Open Chat
                      </button>
                    </>
                  )}
                </div>
              ))}

            <h2 className="font-semibold mt-6 mb-3">Sent Requests</h2>
            {exchanges
              .filter((ex) => ex.requester_id === user.id)
              .map((ex) => (
                <div key={ex.id} className="border p-3 mb-2">
                  <p>
                    <b>Skill:</b> {ex.skill}
                  </p>
                  <p>
                    <b>To:</b> {ex.provider_name}
                  </p>
                  <p>
                    <b>Status:</b> {ex.status}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded shadow">
            {!selectedExchange ? (
              <>
                <h2 className="font-semibold mb-3">Select Exchange</h2>
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
              <>
                <div className="h-64 overflow-y-auto border p-3 mb-3">
                  {messages.map((m, i) => (
                    <div key={i} className="mb-2">
                      <div
                        className={`px-3 py-2 rounded max-w-xs ${
                          m.sender_id === user.id
                            ? "bg-blue-500 text-white ml-auto"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="text-xs opacity-70">
                          {m.sender_name || "User"}
                        </div>
                        <div>{m.message}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="border flex-1 p-2"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* RATINGS */}
        {activeTab === "ratings" && (
          <div className="bg-white p-6 rounded shadow">
            {ratings.length === 0 ? (
              <p>No ratings yet</p>
            ) : (
              ratings.map((r) => (
                <div key={r.id} className="border p-3 mb-2">
                  ⭐ {r.score} by <b>{r.reviewer}</b>
                  <p>{r.comment}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="bg-white p-6 rounded shadow">
            {recommendations.length === 0 ? (
              <p>No recommendations yet</p>
            ) : (
              recommendations.map((s) => (
                <div key={s.id}>
                  {s.title} ({s.score})
                </div>
              ))
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div>
            {!analyticsData ? (
              <p>Loading analytics...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>Users: {analyticsData.totals?.users || 0}</div>
                  <div>Skills: {analyticsData.totals?.skills || 0}</div>
                  <div>Exchanges: {analyticsData.totals?.exchanges || 0}</div>
                </div>

                <Bar data={analyticsData.chart} />
                <Bar data={analyticsData.monthlyExchanges} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}