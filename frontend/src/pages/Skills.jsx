import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get("/api/skills");
        setSkills(res.data);
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      }
    };

    fetchSkills();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Available Skills</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => navigate(`/skills/${skill.id}`)}
            className="bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
          >
            <h3 className="font-semibold">{skill.title}</h3>
            <p className="text-sm text-gray-500">Offered by {skill.owner_name}</p>
            <button className="mt-4 text-primary font-medium">
              Request Exchange →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}