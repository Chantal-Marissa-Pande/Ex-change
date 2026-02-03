import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function SkillDetail() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/skill/${skillId}`); // singular endpoint

        const skillData = {
          ...res.data,
          tags: res.data.tags
            ? res.data.tags.split(",").map((t) => t.trim())
            : [],
        };

        setSkill(skillData);
        setError(null);
      } catch (err) {
        console.error("Skill fetch error:", err);
        if (err.response?.status === 404) {
          setError("Skill not found.");
        } else {
          setError("Failed to load skill details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [skillId]);

  const handleRequestExchange = async () => {
    try {
      if (!skill.listing_id) {
        toast.error("This skill is not available for exchange.");
        return;
      }
      await api.post("/api/exchange", { listing_id: skill.listing_id });
      toast.success("Exchange request sent!");
    } catch (err) {
      console.error("Exchange request failed:", err);
      toast.error("Failed to send exchange request.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading skill…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!skill) return <div className="p-10 text-center text-gray-500">Skill not found.</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <button
        className="mb-6 text-primary underline"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">{skill.title}</h1>
        <p className="text-gray-600 mb-2">
          Offered by <strong>{skill.owner_name}</strong>
        </p>
        <p className="text-gray-600 mb-4">
          Exchanged <strong>{skill.exchange_count || 0}</strong> times
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {skill.tags.map((t, idx) => (
            <span
              key={t + "-" + idx} // Unique key to avoid duplicates
              className="text-xs bg-gray-100 px-2 py-1 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>

        <button
          onClick={handleRequestExchange}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Request Exchange
        </button>
      </div>
    </div>
  );
}