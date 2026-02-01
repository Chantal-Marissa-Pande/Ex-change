import { useEffect, useState } from "react";
import api from "../api/axios";

export default function FeaturedSkills() {
  const token = localStorage.getItem("token");
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchSkills = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSkills(res.data.skills || []);
      } catch (err) {
        console.error("FETCH SKILLS ERROR:", err);
        setError("Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [token]);

  if (loading) return <p className="text-center p-4">Loading skills...</p>;
  if (error) return <p className="text-center p-4 text-red-600">{error}</p>;

  if (!skills.length)
    return <p className="text-center p-4 text-gray-500">No skills listed yet.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {skills.map((skill, idx) => (
        <div
          key={idx}
          className="bg-primary/10 text-primary font-medium py-2 px-4 rounded-lg text-center"
        >
          {skill}
        </div>
      ))}
    </div>
  );
}