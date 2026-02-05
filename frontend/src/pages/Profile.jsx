import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add skill form
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [newSkillTags, setNewSkillTags] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // -----------------------------
  // Fetch profile
  // -----------------------------
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const userRes = await api.get(`/api/user/${userId}`);
      const userData = userRes.data;

      userData.skills =
        userData.skills?.map((s) => ({
          ...s,
          tags: Array.isArray(s.tags)
            ? s.tags
            : typeof s.tags === "string"
            ? s.tags.split(",").map((t) => t.trim())
            : [],
        })) || [];

      setUser(userData);

      const incomingRes = await api
        .get(`/api/user/${userId}/requests/incoming`)
        .catch(() => ({ data: [] }));
      setIncomingRequests(incomingRes.data || []);

      const outgoingRes = await api
        .get(`/api/user/${userId}/requests/outgoing`)
        .catch(() => ({ data: [] }));
      setOutgoingRequests(outgoingRes.data || []);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Failed to load profile.");
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

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

      await api.post("/api/user/skills", {
        title: newSkillTitle,
        tags: tagsArray,
      });

      toast.success("Skill added!");

      setNewSkillTitle("");
      setNewSkillTags("");

      fetchProfile();
    } catch (err) {
      console.error("Add skill error:", err);
      toast.error("Failed to add skill");
    } finally {
      setAddingSkill(false);
    }
  };

  // -----------------------------
  // Render guards
  // -----------------------------
  if (loading) return <div className="p-10 text-center">Loading profile…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!user)
    return (
      <div className="p-10 text-center text-gray-500">User not found.</div>
    );

  return (
    <div className="min-h-screen bg-background p-8">
      <button
        className="mb-6 text-primary underline"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      {/* ---------------- User Info ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
        <p className="text-gray-600 mb-1">
          <strong>Email:</strong> {user.email}
        </p>

        <p className="text-gray-600">
          <strong>Skills:</strong>{" "}
          {user.skills.length
            ? user.skills.map((s) => s.title).join(", ")
            : "None yet"}
        </p>

        {user.skills.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {user.skills.map((s, idx) =>
              s.tags.map((t, i) => (
                <span
                  key={`${idx}-${i}`}
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                >
                  {t}
                </span>
              ))
            )}
          </div>
        )}
      </section>

      {/* ---------------- Add Skill ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add a Skill</h2>

        <form onSubmit={handleAddSkill} className="space-y-3">
          <input
            type="text"
            placeholder="Skill title (e.g. UI Design)"
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
      </section>

      {/* ---------------- Incoming Requests ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
        {incomingRequests.length ? (
          <ul className="space-y-2">
            {incomingRequests.map((r) => (
              <li
                key={r.exchange_id}
                className="flex justify-between bg-gray-100 p-4 rounded-lg"
              >
                <span>
                  <strong>{r.requester_name}</strong> wants{" "}
                  <em>{r.skill_requested}</em>
                </span>
                <span className="text-gray-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No incoming requests.</p>
        )}
      </section>

      {/* ---------------- Outgoing Requests ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Outgoing Requests</h2>
        {outgoingRequests.length ? (
          <ul className="space-y-2">
            {outgoingRequests.map((r) => (
              <li
                key={r.exchange_id}
                className="flex justify-between bg-gray-100 p-4 rounded-lg"
              >
                <span>
                  Requested <em>{r.skill_offered}</em> from{" "}
                  <strong>{r.recipient_name}</strong>
                </span>
                <span className="text-gray-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No outgoing requests.</p>
        )}
      </section>
    </div>
  );
}