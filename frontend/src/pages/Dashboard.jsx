import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import Skills from "./Skills";
import AddSkillForm from "./AddSkillForm";
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
  // Recommendations State
  // -----------------------------
  const [recommendations, setRecommendations] = useState([]);

  // -----------------------------
  // Load Dashboard Data
  // -----------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Only fetch the existing /users/me route
        const userRes = await api.get("/users/me");
        const userData = userRes.data;

        const cleanTags = (tagString) =>
          tagString
            ? tagString
                .split(",")
                .map((t) => t.replace(/[^\w\s]/g, "").trim())
                .filter(Boolean)
            : [];

        const skillsWithTags = (userData.skills || []).map((s) => ({
          ...s,
          tags: Array.isArray(s.tags)
            ? s.tags.map((t) => t.replace(/[^\w\s]/g, "").trim())
            : cleanTags(s.tags),
        }));

        setUser(userData);
        setProfile({ ...userData, skills: skillsWithTags });
        setSkills(skillsWithTags);

        // Placeholders for missing endpoints
        setRequests({ incoming: [], outgoing: [] });
        setRatings([]);
        setRecommendations([]);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // -----------------------------
  // Messaging Functions
  // -----------------------------
  const loadMessages = async (exchangeId) => {
    try {
      const res = await api.get(`/messages/${exchangeId}`);
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
      await api.post("/messages", {
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

  // -----------------------------
  // Rating Submission
  // -----------------------------
  const submitRating = async (exchangeId, ratedUserId) => {
    try {
      await api.post("/ratings", {
        exchange_id: exchangeId,
        rated_user_id: ratedUserId,
        rating: ratingValue,
        review,
      });
      toast.success("Rating submitted!");
      setReview("");
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  // -----------------------------
  // Delete Skill
  // -----------------------------
  const handleDeleteSkill = async (skillId) => {
    const prevSkills = [...profile.skills];
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));
    setSkills((prev) => prev.filter((s) => s.id !== skillId));

    try {
      await api.delete(`/users/skills/${skillId}`); // ✅ plural 'users'
      toast.success("Skill deleted!");
    } catch (err) {
      console.error("Delete skill error:", err);
      toast.error("Failed to delete skill");
      setProfile((prev) => ({ ...prev, skills: prevSkills }));
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || "User"} 👋</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {["skills","profile","requests","messages","ratings","recommendations","analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded transition-all duration-200 ${
                activeTab === tab ? "bg-blue-600 text-white shadow" : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <Skills
            currentUser={user}
            skills={skills}
            setSkills={setSkills}
          />
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>

            <h3 className="font-semibold mt-4 mb-2">My Skills</h3>
            {profile.skills.length ? (
              <ul className="space-y-2">
                {profile.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="bg-gray-100 p-3 rounded flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="font-semibold">{skill.title} ({skill.level})</p>
                      <p className="text-sm text-gray-600">{skill.category} | {skill.years_experience} yrs</p>
                      <p className="text-sm text-gray-500">{skill.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skill.tags.map((tag, idx) => (
                          <span key={idx} className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No skills added yet</p>
            )}

            {/* Add Skill Form */}
            <div className="mt-6 border-t pt-4">
              <AddSkillForm
                currentUser={user}
                onSkillAdded={(newSkill) => {
                  const cleanSkill = {
                    ...newSkill,
                    tags: (newSkill.tags || []).map((t) => t.replace(/[^\w\s]/g, "").trim()),
                  };
                  setProfile((prev) => ({ ...prev, skills: [cleanSkill, ...prev.skills] }));
                  setSkills((prev) => [cleanSkill, ...prev]);
                }}
              />
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="bg-white p-6 rounded shadow">
            <p>Requests will be displayed here (coming soon)</p>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded shadow">
            <p>Messaging interface coming soon</p>
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === "ratings" && (
          <div className="bg-white p-6 rounded shadow">
            <p>Ratings interface coming soon</p>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div className="bg-white p-6 rounded shadow">
            <p>Recommendations will appear here (coming soon)</p>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded shadow">
            <p>Analytics graphs will appear here (coming soon)</p>
          </div>
        )}
      </div>
    </div>
  );
}