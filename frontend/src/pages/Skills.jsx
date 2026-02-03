import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Skills({ currentUser }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // -----------------------------
  // Fetch skills function
  // -----------------------------
  const fetchSkills = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await api.get("/api/skill", {
        params: {
          q: query,
          mine: mineOnly ? "true" : "false",
          sort,
        },
      });

      const skillsData = res.data.map((s) => ({
        ...s,
        tags: s.tags ? s.tags.split(",").map((t) => t.trim()) : [],
      }));

      setSkills(skillsData);
      setError(null);
    } catch (err) {
      console.error("Skills fetch error:", err);
      setError("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Fetch skills on debounce, mineOnly, sort change
  // -----------------------------
  useEffect(() => {
    fetchSkills();
  }, [debouncedSearch, mineOnly, sort]);

  // -----------------------------
  // Filter skills by selected tags
  // -----------------------------
  const filteredSkills = skills.filter((skill) => {
    if (selectedTags.length === 0) return true;
    return skill.tags.some((t) => selectedTags.includes(t));
  });

  // -----------------------------
  // Send exchange request
  // -----------------------------
  const handleRequestExchange = async (listingId) => {
    if (!listingId) {
      toast.error("This skill is not available for exchange.");
      return;
    }

    try {
      await api.post("/api/exchange", { listing_id: listingId });
      toast.success("Exchange request sent!");
    } catch (err) {
      console.error("Exchange request failed:", err);
      toast.error("Failed to send exchange request.");
    }
  };

  // -----------------------------
  // Reset search/filter
  // -----------------------------
  const handleBack = () => {
    setSearch("");
    setMineOnly(false);
    setSelectedTags([]);
    setSort("newest");
    setSkills([]);
    setError(null);
  };

  // -----------------------------
  // Unique tags
  // -----------------------------
  const allTags = [...new Set(skills.flatMap((s) => s.tags || []))];

  if (loading) return <p className="text-center p-8">Loading skills...</p>;
  if (error) return <p className="text-center p-8 text-red-600">{error}</p>;

  return (
    <section className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Skills Marketplace</h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search skills"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />

        <button
          onClick={() => fetchSkills(search)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Search
        </button>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={() => setMineOnly(!mineOnly)}
          />
          Skills I offered
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Exchanged</option>
        </select>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                selectedTags.includes(tag)
                  ? setSelectedTags(selectedTags.filter((t) => t !== tag))
                  : setSelectedTags([...selectedTags, tag])
              }
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedTags.includes(tag)
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filteredSkills.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 mb-4">
            No skills match your search or filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setMineOnly(false);
              setSelectedTags([]);
              setSort("newest");
              setError(null);
              fetchSkills(""); // reload original full list
            }}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            ← Back to all skills
          </button>
        </div>
      ) : (
        
        <ul className="space-y-3">
          {filteredSkills.map((skill) => (
            <li
              key={skill.id + "-" + skill.owner_id}
              className="border p-4 rounded-lg hover:bg-gray-50"
            >
              <div
                onClick={() => navigate(`/skills/${skill.id}`)}
                className="cursor-pointer"
              >
                <h3 className="font-medium">{skill.title}</h3>
                <p className="text-sm text-gray-600">
                  Offered by {skill.owner_name}
                </p>
                {skill.tags?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {skill.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleRequestExchange(skill.listing_id || null)}
                className="mt-2 text-primary font-medium"
              >
                Request Exchange →
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}