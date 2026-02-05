import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import Skills from "./Skills";

export default function Dashboard() {
  const navigate = useNavigate();

  // -----------------------------
  // State
  // -----------------------------
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ skills: [] });
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [skills, setSkills] = useState([]);

  const [activeTab, setActiveTab] = useState("skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // Add skill form
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [newSkillTags, setNewSkillTags] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // -----------------------------
  // Load user + requests
  // -----------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userRes, requestsRes] = await Promise.all([
          api.get("/api/user/me"),
          api.get("/api/user/requests"),
        ]);

        setUser(userRes.data);
        setRequests({
          incoming: requestsRes.data?.incoming || [],
          outgoing: requestsRes.data?.outgoing || [],
        });

        // Load profile after user
        await loadProfile(userRes.data.id);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // -----------------------------
  // Load profile
  // -----------------------------
  const loadProfile = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const res = await api.get(`/api/user/${userId}`);
      const data = res.data;

      // Ensure skills array and tags
      const skillsWithTags = (data.skills || []).map((s) => ({
        ...s,
        tags: Array.isArray(s.tags)
          ? s.tags
          : typeof s.tags === "string"
          ? s.tags.split(",").map((t) => t.trim())
          : [],
      }));

      setProfile({ ...data, skills: skillsWithTags });
    } catch (err) {
      console.error("Profile load error:", err);
      toast.error("Failed to load profile");
    }
  };

  // -----------------------------
  // Add skill
  // -----------------------------
  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!newSkillTitle.trim()) {
      toast.error("Skill title is required");
      return;
    }

    try {
      setAddingSkill(true);

      const tagsArray = newSkillTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Optimistic UI: add skill locally before server responds
      const tempSkill = {
        id: Date.now(),
        title: newSkillTitle,
        tags: tagsArray,
      };
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, tempSkill],
      }));

      await api.post("/api/user/skills", {
        title: newSkillTitle,
        tags: tagsArray,
      });

      toast.success("Skill added!");

      setNewSkillTitle("");
      setNewSkillTags("");

      // Reload profile to sync with server
      loadProfile();
    } catch (err) {
      console.error("Add skill error:", err);
      toast.error("Failed to add skill");

      // rollback optimistic update
      setProfile((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s.id !== tempSkill.id),
      }));
    } finally {
      setAddingSkill(false);
    }
  };

  // -----------------------------
  // Delete skill
  // -----------------------------
  const handleDeleteSkill = async (skillId) => {
    // Optimistic UI
    const originalSkills = profile.skills;
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));

    try {
      await api.delete(`/api/user/skills/${skillId}`);
      toast.success("Skill deleted!");
    } catch (err) {
      console.error("Delete skill error:", err);
      toast.error("Failed to delete skill");
      // rollback
      setProfile((prev) => ({ ...prev, skills: originalSkills }));
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || "User"} 👋</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {["skills", "profile", "requests", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ---------------- Skills Marketplace ---------------- */}
        {activeTab === "skills" && (
          <Skills
            currentUser={user}
            skills={skills || []}
            setSkills={setSkills}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        )}

        {/* ---------------- Profile ---------------- */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>

            <div>
              <strong>My Skills:</strong>
              {profile?.skills?.length ? (
                <ul className="list-disc list-inside mt-2 space-y-2">
                  {profile.skills.map((skill) => (
                    <li key={skill.id} className="flex items-center gap-2">
                      {skill.title}
                      <div className="flex gap-1 ml-2">
                        {skill.tags.map((t, idx) => (
                          <span
                            key={`${skill.id}-tag-${idx}`}
                            className="text-xs bg-gray-200 px-2 py-1 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="ml-auto text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-1">No skills added yet</p>
              )}
            </div>

            {/* Add Skill */}
            <form onSubmit={handleAddSkill} className="mt-4 space-y-3">
              <h3 className="font-semibold text-lg">Add a Skill</h3>

              <input
                type="text"
                placeholder="Skill title (e.g. Web Design)"
                value={newSkillTitle}
                onChange={(e) => setNewSkillTitle(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newSkillTags}
                onChange={(e) => setNewSkillTags(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <button
                type="submit"
                disabled={addingSkill}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {addingSkill ? "Adding..." : "Add Skill"}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- Requests ---------------- */}
        {activeTab === "requests" && (
          <div className="bg-white p-6 rounded shadow space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Incoming Requests</h2>
              {requests?.incoming?.length ? (
                <ul className="space-y-2">
                  {requests.incoming.map((r) => (
                    <li key={r.exchange_id} className="bg-gray-100 p-3 rounded">
                      {r.requester_name} wants <b>{r.skill_requested}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No incoming requests</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Outgoing Requests</h2>
              {requests?.outgoing?.length ? (
                <ul className="space-y-2">
                  {requests.outgoing.map((r) => (
                    <li key={r.exchange_id} className="bg-gray-100 p-3 rounded">
                      You requested <b>{r.skill_requested}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No outgoing requests</p>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Analytics ---------------- */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded shadow space-y-2">
            <p>
              <strong>Total Skills:</strong> {profile?.skills?.length || 0}
            </p>
            <p>
              <strong>Incoming Requests:</strong> {requests?.incoming?.length || 0}
            </p>
            <p>
              <strong>Outgoing Requests:</strong> {requests?.outgoing?.length || 0}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}