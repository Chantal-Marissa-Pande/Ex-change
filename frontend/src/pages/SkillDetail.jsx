import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function SkillDetail() {
  const { skillId } = useParams();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/skills/${skillId}`);
        setSkill(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load skill details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [skillId]);

  const handleRequest = async () => {
    setRequesting(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/api/exchanges",
        { listing_id: skill.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Skill request submitted successfully!");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading skill...</p>;
  if (error) return <p className="text-center p-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-primary mb-4">
          {skill.title}
        </h1>
        <p className="text-text mb-2">{skill.description || "No description"}</p>
        <p className="text-text mb-4">
          <span className="font-medium">Category:</span> {skill.category}
        </p>
        <p className="text-text mb-6">
          <span className="font-medium">Provided by:</span> {skill.owner_name}
        </p>

        {successMessage && (
          <p className="text-green-600 mb-4">{successMessage}</p>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <button
          onClick={handleRequest}
          disabled={requesting}
          className={`w-full bg-primary text-white py-3 rounded-md hover:bg-green-700 transition ${
            requesting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {requesting ? "Submitting..." : "Request this Skill"}
        </button>
      </div>
    </div>
  );
}