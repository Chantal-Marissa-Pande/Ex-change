import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddSkillForm({ currentUser, onSkillAdded }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [yearsExperience, setYearsExperience] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSkill = async () => {
    if (!title || !category) {
      toast.error("Title and Category are required");
      return;
    }

    setLoading(true);

    try {
      const cleanedTags = tags
        .split(",")
        .map((t) => t.replace(/[^\w\s]/g, "").trim())
        .filter(Boolean);

      const res = await api.post("/users/skills", {
        title,
        category,
        level,
        years_experience: Number(yearsExperience) || 0,
        tags: cleanedTags,
        description,
      });

      toast.success("Skill added successfully!");
      onSkillAdded(res.data);

      // Reset
      setTitle("");
      setCategory("");
      setLevel("Beginner");
      setYearsExperience("");
      setTags("");
      setDescription("");
    } catch (err) {
      console.error("Add skill error:", err);
      toast.error(err.response?.data?.error || "Failed to add skill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded shadow space-y-3">
      <h3 className="font-semibold text-lg">Add New Skill</h3>
      <input type="text" placeholder="Skill Title" value={title} onChange={e=>setTitle(e.target.value)} className="border px-3 py-2 w-full rounded"/>
      <input type="text" placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} className="border px-3 py-2 w-full rounded"/>
      <select value={level} onChange={e=>setLevel(e.target.value)} className="border px-3 py-2 w-full rounded">
        {["Beginner","Intermediate","Advanced"].map(lvl=><option key={lvl} value={lvl}>{lvl}</option>)}
      </select>
      <input type="number" placeholder="Years of Experience" value={yearsExperience} onChange={e=>setYearsExperience(e.target.value)} className="border px-3 py-2 w-full rounded"/>
      <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} className="border px-3 py-2 w-full rounded"/>
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="border px-3 py-2 w-full rounded"/>
      <button onClick={handleAddSkill} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
        {loading ? "Adding..." : "Add Skill"}
      </button>
    </div>
  );
}