import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function SkillDetail() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newRating, setNewRating] = useState({ rating: 5, comment: "" });
  const [canRate, setCanRate] = useState(false); // <-- initially can't rate

  useEffect(() => {
    const fetchSkillData = async () => {
      try {
        const res = await api.get(`/api/skills/${skillId}`);
        const skillData = res.data;

        // ensure tags are arrays
        skillData.tags = skillData.tags
          ? Array.isArray(skillData.tags)
            ? skillData.tags
            : skillData.tags.split(",").map((t) => t.trim())
          : [];

        skillData.messages = skillData.messages || [];
        skillData.ratings = skillData.ratings || [];

        setSkill(skillData);
      } catch (err) {
        console.error("Skill fetch error:", err);
        toast.error("Failed to load skill");
      } finally {
        setLoading(false);
      }
    };
    fetchSkillData();
  }, [skillId]);

  // -----------------------------
  // Send request/message
  // -----------------------------
const sendRequest = async () => {
  if (!skill?.listing_id) {
    toast.error("This skill has no active listing");
    return;
  }

  try {
    await api.post("/api/exchange", {
      listing_id: skill.listing_id,
    });

    setCanRate(true);
    toast.success("Request sent! You can now rate this skill.");
  } catch (err) {
    console.error("Send request error:", err);
    toast.error("Failed to send request");
  }
};

  // -----------------------------
  // Submit rating
  // -----------------------------
  const submitRating = async () => {
    try {
      const res = await api.post(`/api/skills/${skillId}/rate`, newRating);
      setSkill((prev) => ({ ...prev, ratings: [res.data, ...prev.ratings] }));
      setNewRating({ rating: 5, comment: "" });
      toast.success("Rating submitted!");
    } catch (err) {
      console.error("Add rating error:", err);
      toast.error("Failed to add rating");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading skill…</div>;
  if (!skill) return <div className="p-10 text-center text-gray-500">Skill not found</div>;

  return (
    <div className="min-h-screen p-6 bg-background max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-primary underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold">{skill.title}</h1>
      <p className="text-gray-600 mb-2">Offered by <strong>{skill.owner_name}</strong></p>

      <div className="flex gap-2 mt-2 flex-wrap">
        {skill.tags.map((t, idx) => (
          <span key={`${t}-${idx}`} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {t}
          </span>
        ))}
      </div>

      <h2 className="mt-4 font-semibold">Listing</h2>
      {skill.listing_id ? (
        <p>{skill.listing_description}</p>
      ) : (
        <p className="text-gray-500">No listings available</p>
      )}

      <h2 className="mt-4 font-semibold">Send a Request</h2>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="border p-2 flex-1 rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your request/message..."
        />
        <button
          onClick={sendRequest}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send Request
        </button>
      </div>

      {/* Only show ratings after request */}
      {canRate && (
        <>
          <h2 className="mt-6 font-semibold">Ratings</h2>
          <div>
            {skill.ratings.map((r) => (
              <div key={r.id} className="border p-2 my-1 rounded">
                <strong>{r.user_name}:</strong> {r.rating} ⭐ — {r.comment}
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <select
                value={newRating.rating}
                onChange={(e) =>
                  setNewRating((prev) => ({ ...prev, rating: Number(e.target.value) }))
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Comment"
                value={newRating.comment}
                onChange={(e) =>
                  setNewRating((prev) => ({ ...prev, comment: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <button
                onClick={submitRating}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}