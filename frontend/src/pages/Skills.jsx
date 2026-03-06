import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Skills({ currentUser }) {

  const navigate=useNavigate();

  const [allSkills,setAllSkills]=useState([]);
  const [skills,setSkills]=useState([]);
  const [query,setQuery]=useState("");

  useEffect(()=>{
    loadSkills();
  },[]);

  const loadSkills=async()=>{
    try{
      const res=await api.get("/skills");
      setAllSkills(res.data);
      setSkills(res.data);
    }catch{
      toast.error("Failed to load skills");
    }
  };

  const search=()=>{

    if(!query){
      setSkills(allSkills);
      return;
    }

    const filtered=allSkills.filter(s=>
      s.title.toLowerCase().includes(query.toLowerCase())
    );

    setSkills(filtered);
  };

  return(

    <div>

      <div className="flex gap-2 mb-4">

        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Search skills"
          className="border p-2 flex-1"
        />

        <button
          onClick={search}
          className="bg-blue-600 text-white px-4"
        >
          Search
        </button>

        <button
          onClick={()=>setSkills(allSkills)}
          className="bg-gray-400 px-4"
        >
          Reset
        </button>

      </div>

      <div className="grid grid-cols-3 gap-4">

        {skills.map(skill=>(

          <div key={skill.id} className="border p-3 rounded cursor-pointer" onClick={()=>navigate(`/skills/${skill.id}`)}>

            <h3 className="font-bold">{skill.title}</h3>

            <p>{skill.owner_name}</p>

          </div>

        ))}

      </div>

    </div>

  );

}