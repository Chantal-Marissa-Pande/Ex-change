// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import Skills from "./Skills";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [userRes, requestsRes] = await Promise.all([
        api.get("/api/user/me"),
        api.get("/api/user/requests").catch(() => ({ data: [] })),
      ]);

      setUser(userRes.data);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Load profile skills when tab active
  const loadProfile = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/user/${user.id}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "profile" && !profile) {
      loadProfile();
    }
  }, [activeTab, user]);

  const handleAddSkill = async (title, tags) => {
    try {
      const res = await api.post("/api/user/add-skill", { title, tags });
      toast.success("Skill added!");
      // Refresh profile after adding
      loadProfile();
    } catch (err) {
      console.error("Add skill error:", err);
      toast.error("Failed to add skill.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user.name} 👋</h1>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {[
            { id: "skills", label: "Skills Marketplace" },
            { id: "profile", label: "My Profile" },
            { id: "requests", label: "Requests" },
            { id: "analytics", label: "Analytics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skills Marketplace */}
        {activeTab === "skills" && <Skills currentUser={user} />}

        {/* Profile */}
        {activeTab === "profile" && profile && (
          <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>My Skills:</strong>{" "}
              {profile.skills?.length ? profile.skills.map(s => s.title).join(", ") : "None yet"}
            </p>

            {/* Add Skill Form */}
            <AddSkillForm onAddSkill={handleAddSkill} />
          </section>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
            {requests.length ? (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex justify-between bg-gray-100 p-4 rounded-lg"
                  >
                    <span>
                      <strong>{r.requester}</strong> wants <em>{r.skill}</em>
                    </span>
                    <span className="text-sm text-gray-500">{r.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No requests yet.</p>
            )}
          </section>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Your Dashboard Analytics</h2>
            <p>
              Total Skills Offered: <strong>{profile?.skills?.length || 0}</strong>
            </p>
            <p>
              Incoming Requests: <strong>{requests.length}</strong>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

// -----------------
// Add Skill Form Component
// -----------------
function AddSkillForm({ onAddSkill }) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onAddSkill(title, tagsArray);
    setTitle("");
    setTags("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <h3 className="font-semibold">Add a Skill</h3>
      <input
        type="text"
        placeholder="Skill title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
        Add Skill
      </button>
    </form>
  );
}