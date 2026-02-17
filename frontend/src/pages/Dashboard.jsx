import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import Skills from "./Skills";
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

  // -----------------------------
  // Core State
  // -----------------------------
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ skills: [] });
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [skills, setSkills] = useState([]);
  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Messaging State
  // -----------------------------
  const [messages, setMessages] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // -----------------------------
  // Ratings State
  // -----------------------------
  const [ratings, setRatings] = useState([]);
  const [ratingValue, setRatingValue] = useState(5);
  const [review, setReview] = useState("");

  // -----------------------------
  // AI Recommendations State
  // -----------------------------
  const [recommendations, setRecommendations] = useState([]);

  // -----------------------------
  // Skill Editing State
  // -----------------------------
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillForm, setSkillForm] = useState({
    title: "",
    level: "",
    years_experience: 0,
    category: "",
    description: "",
    tags: [],
  });

  // -----------------------------
  // Load Dashboard
  // -----------------------------
  const loadDashboard = async () => {
    try {
      const [userRes, requestsRes, ratingsRes, recRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/users/requests"),
        api.get("/users/ratings"),
        api.get("/users/recommendations"),
      ]);

      const userData = userRes.data;

      const skillsWithTags = (userData.skills || []).map((s) => ({
        ...s,
        tags: Array.isArray(s.tags)
          ? s.tags
          : typeof s.tags === "string"
          ? s.tags.split(",").map((t) => t.trim())
          : [],
      }));

      setUser(userData);
      setProfile({ ...userData, skills: skillsWithTags });
      setRequests({
        incoming: requestsRes.data?.incoming || [],
        outgoing: requestsRes.data?.outgoing || [],
      });
      setRatings(ratingsRes.data || []);
      setRecommendations(recRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // -----------------------------
  // Messaging Functions
  // -----------------------------
  const loadMessages = async (exchangeId) => {
    try {
      const res = await api.get(`/api/messages/${exchangeId}`);
      setMessages(res.data);
      setSelectedExchange(exchangeId);
      scrollToBottom();
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await api.post("/api/messages", {
        exchange_id: selectedExchange,
        content: newMessage,
      });
      setNewMessage("");
      loadMessages(selectedExchange);
    } catch {
      toast.error("Message failed");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (!selectedExchange) return;
    const interval = setInterval(() => loadMessages(selectedExchange), 5000);
    return () => clearInterval(interval);
  }, [selectedExchange]);

  // -----------------------------
  // Ratings Submission
  // -----------------------------
  const submitRating = async (exchangeId, ratedUserId) => {
    try {
      await api.post("/api/ratings", {
        exchange_id: exchangeId,
        rated_user_id: ratedUserId,
        rating: ratingValue,
        review,
      });
      toast.success("Rating submitted!");
      setReview("");
      loadDashboard();
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // -----------------------------
  // Skill Edit/Add
  // -----------------------------
  const startEditing = (skill) => {
    setEditingSkillId(skill?.id || null);
    setSkillForm(skill || { title: "", level: "", years_experience: 0, category: "", description: "", tags: [] });
  };

  const saveSkill = async () => {
    try {
      if (editingSkillId) {
        await api.put(`/api/skills/${editingSkillId}`, skillForm);
        toast.success("Skill updated!");
      } else {
        await api.post("/api/skills", skillForm);
        toast.success("Skill added!");
      }
      setEditingSkillId(null);
      loadDashboard();
    } catch {
      toast.error("Failed to save skill");
    }
  };

  // -----------------------------
  // Recommendation Actions
  // -----------------------------
  const handleConnect = async (recId) => {
    try {
      await api.post("/api/connections", { user_id: recId });
      toast.success("Connection request sent!");
    } catch {
      toast.error("Failed to send connection request");
    }
  };

  const viewSkillDetails = (rec) => {
    navigate(`/skills/${rec.skill_id}`);
  };

  if (loading)
    return <div className="p-10 text-center text-xl">Loading dashboard...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;

  const chartData = {
    labels: profile.skills.map((s) => s.title),
    datasets: [
      {
        label: "Years Experience",
        data: profile.skills.map((s) => s.years_experience || 0),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold">
            Welcome, {user?.name || "User"} 👋
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
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
              className={`px-4 py-2 rounded transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Skills Marketplace */}
        {activeTab === "skills" && (
          <Skills currentUser={user} skills={skills} setSkills={setSkills} />
        )}

        {/* Profile */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>

            <h3 className="font-semibold mt-4 mb-2">My Skills</h3>

            {/* Add Skill Button */}
            <button
              onClick={() => startEditing(null)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mb-2"
            >
              + Add Skill
            </button>

            {editingSkillId !== null || skillForm.title ? (
              <div className="p-3 border rounded bg-gray-50 space-y-2 mb-2">
                <input
                  placeholder="Title"
                  value={skillForm.title}
                  onChange={(e) => setSkillForm({ ...skillForm, title: e.target.value })}
                  className="w-full border p-1 rounded"
                />
                <input
                  placeholder="Level"
                  value={skillForm.level}
                  onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                  className="w-full border p-1 rounded"
                />
                <input
                  type="number"
                  placeholder="Years Experience"
                  value={skillForm.years_experience}
                  onChange={(e) => setSkillForm({ ...skillForm, years_experience: +e.target.value })}
                  className="w-full border p-1 rounded"
                />
                <input
                  placeholder="Category"
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                  className="w-full border p-1 rounded"
                />
                <textarea
                  placeholder="Description"
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full border p-1 rounded"
                />
                <input
                  placeholder="Tags (comma separated)"
                  value={skillForm.tags.join(", ")}
                  onChange={(e) => setSkillForm({ ...skillForm, tags: e.target.value.split(",").map(t => t.trim()) })}
                  className="w-full border p-1 rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveSkill}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSkillId(null)}
                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {profile.skills.length ? (
              <ul className="space-y-2">
                {profile.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="bg-gray-100 p-3 rounded flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="font-semibold">{skill.title} ({skill.level})</p>
                      <p className="text-sm text-gray-600">
                        {skill.category} | {skill.years_experience} yrs
                      </p>
                      <p className="text-sm text-gray-500">{skill.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skill.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(skill)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No skills added yet</p>
            )}
          </div>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold">Incoming Requests</h2>
            {requests.incoming.length ? (
              requests.incoming.map((r) => (
                <div
                  key={r.exchange_id}
                  className="flex justify-between items-center bg-gray-100 p-3 rounded"
                >
                  <div>
                    {r.requester_name} wants <strong>{r.skill_requested}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                      Accept
                    </button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No incoming requests</p>
            )}

            <h2 className="text-xl font-semibold mt-6">Outgoing Requests</h2>
            {requests.outgoing.length ? (
              requests.outgoing.map((r) => (
                <div key={r.exchange_id} className="bg-gray-100 p-3 rounded">
                  You requested <strong>{r.skill_requested}</strong>
                </div>
              ))
            ) : (
              <p>No outgoing requests</p>
            )}
          </div>
        )}

        {/* Messages */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded shadow">
            {!selectedExchange ? (
              <div className="space-y-2">
                {[...requests.incoming, ...requests.outgoing].map((r) => (
                  <button
                    key={r.exchange_id}
                    onClick={() => loadMessages(r.exchange_id)}
                    className="block w-full text-left bg-gray-100 p-2 rounded hover:bg-gray-200"
                  >
                    Conversation #{r.exchange_id} with {r.requester_name || user.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-64 overflow-y-auto border p-3 rounded bg-gray-50">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-1 ${
                        m.sender_id === user.id
                          ? "text-right text-white bg-blue-600 rounded ml-auto w-max"
                          : "text-left bg-gray-200 rounded w-max"
                      }`}
                    >
                      <strong>{m.sender_name}:</strong> {m.content}
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 border p-2 rounded"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ratings */}
        {activeTab === "ratings" && (
          <div className="bg-white p-6 rounded shadow space-y-3">
            {ratings.length ? (
              ratings.map((r) => (
                <div key={r.id} className="border p-3 rounded">
                  <p>
                    ⭐ {r.score} - {r.comment}
                  </p>
                </div>
              ))
            ) : (
              <p>No ratings yet</p>
            )}
          </div>
        )}

        {/* Recommendations */}
        {activeTab === "recommendations" && (
          <div className="bg-white p-6 rounded shadow space-y-3">
            {recommendations.length ? (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="border p-3 rounded flex justify-between items-center"
                >
                  <div>
                    <strong>{rec.name}</strong>
                    <div className="text-sm text-gray-600">
                      {rec.years_experience} years experience
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(rec.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => viewSkillDetails(rec)}
                      className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                    >
                      View Skill
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No recommendations available</p>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <p>Total Skills: {profile.skills.length}</p>
            <p>Incoming Requests: {requests.incoming.length}</p>
            <p>Outgoing Requests: {requests.outgoing.length}</p>
            <p>Total Ratings: {ratings.length}</p>

            {profile.skills.length ? (
              <div className="mt-4">
                <Bar data={chartData} options={{ responsive: true }} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}