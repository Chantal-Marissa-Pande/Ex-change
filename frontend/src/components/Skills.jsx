import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/skill", {
          params: {
            q: query,
            mine: mineOnly,
            sort,
          },
        });

        setSkills(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Skills fetch error:", err);
        setError("Failed to load skills.");
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [query, mineOnly, sort]);

  return (
    <section className="bg-white p-6 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Skills Marketplace</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search skills or users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="flex items-center gap-2 text-sm">
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
          className="border p-2 rounded focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Exchanged</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-gray-500">Loading skills…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : skills.length ? (
        <ul className="space-y-3">
          {skills.map((skill) => (
            <li
              key={skill.id}
              className="border p-4 rounded-lg hover:bg-gray-50 transition"
            >
              {/* Clickable Skill Area */}
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/profile/${skill.user_id}`)}
              >
                <h3 className="font-medium text-lg">{skill.title}</h3>
                <p className="text-sm text-gray-600">
                  Offered by{" "}
                  <span className="font-medium">{skill.user_name}</span>
                </p>
              </div>

              {/* Actions (future-safe) */}
              <div className="mt-3 flex gap-4">
                <button
                  onClick={() => navigate(`/profile/${skill.user_id}`)}
                  className="text-sm text-primary underline"
                >
                  View Profile
                </button>

                {/* Placeholder for future exchange request */}
                {/* 
                <button className="text-sm text-green-600 underline">
                  Request Exchange
                </button>
                */}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No skills found.</p>
      )}
    </section>
  );
}