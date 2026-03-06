import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddSkillForm({ onSkillAdded }) {

  const [title,setTitle]=useState("");
  const [category,setCategory]=useState("");
  const [level,setLevel]=useState("Beginner");
  const [years,setYears]=useState("");
  const [tags,setTags]=useState("");
  const [description,setDescription]=useState("");

  const addSkill=async()=>{

    if(!title || !category){
      toast.error("Title and category required");
      return;
    }

    try{

      const res=await api.post("/users/skills",{
        title,
        category,
        level,
        years_experience:Number(years)||0,
        tags:tags.split(",").map(t=>t.trim()),
        description
      });

      onSkillAdded(res.data);

      toast.success("Skill added");

      setTitle("");
      setCategory("");
      setLevel("Beginner");
      setYears("");
      setTags("");
      setDescription("");

    }catch{
      toast.error("Failed to add skill");
    }

  };

  return(

    <div className="space-y-2">

      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="border p-2 w-full"/>

      <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" className="border p-2 w-full"/>

      <select value={level} onChange={e=>setLevel(e.target.value)} className="border p-2 w-full">
        {["Beginner","Intermediate","Advanced"].map(l=><option key={l}>{l}</option>)}
      </select>

      <input value={years} onChange={e=>setYears(e.target.value)} placeholder="Years experience" className="border p-2 w-full"/>

      <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="tags" className="border p-2 w-full"/>

      <textarea value={description} onChange={e=>setDescription(e.target.value)} className="border p-2 w-full"/>

      <button onClick={addSkill} className="bg-green-600 text-white px-4 py-2 rounded w-full">
        Add Skill
      </button>

    </div>

  );

}