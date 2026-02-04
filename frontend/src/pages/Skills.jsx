import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Skills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState([]);

  const fetchSkills = async (query = "", tag = "") => {
    try {
      setLoading(true);
      const res = await api.get("/api/skills", { params: { q: query, tag } });
      const data = res.data.map((skill) => ({
        ...skill,
        tags: Array.isArray(skill.tags)
          ? skill.tags
          : typeof skill.tags === "string"
          ? skill.tags.split(",").map((t) => t.trim())
          : [],
        exchange_count: skill.exchange_count || 0,
      }));

      setSkills(data);

      // Extract unique tags
      const allTags = new Set();
      data.forEach((skill) => skill.tags.forEach((t) => allTags.add(t)));
      setTags([...allTags]);

      setError(null);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setError("Failed to load skills.");
      toast.error("Failed to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSearch = () => fetchSkills(searchQuery, selectedTag);

  if (loading) return <div className="p-10 text-center">Loading skills…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!skills.length) return <div className="p-10 text-center text-gray-500">No skills available.</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-6">All Skills</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search skills..."
          className="border rounded px-4 py-2 flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="">All Tags</option>
          {tags.map((tag, idx) => (
            <option key={idx} value={tag}>{tag}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="p-4 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate(`/skills/${skill.id}`)}
          >
            <h2 className="text-xl font-semibold mb-2">{skill.title}</h2>
            <p className="text-gray-600">Offered by <strong>{skill.owner_name}</strong></p>
            <p className="text-gray-500 text-sm">Exchanged {skill.exchange_count} times</p>

            <div className="flex gap-2 mt-2 flex-wrap">
              {skill.tags.map((t, idx) => (
                <span key={`${t}-${idx}`} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}