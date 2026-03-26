import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Skills({ marketplaceSkills = [] }) {
  const navigate = useNavigate();

  const [skills,setSkills] = useState([]);
  const [query,setQuery]=useState("");

  useEffect(()=>{
    setSkills(marketplaceSkills);
  },[marketplaceSkills]);

  const search=()=>{
    if(!query){
      setSkills(marketplaceSkills);
      return;
    }

    const filtered=marketplaceSkills.filter(s=>
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
          onClick={()=>{
            setQuery("");
            setSkills(marketplaceSkills);
          }}
          className="bg-gray-400 px-4"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {skills.length===0 && (
          <p>No skills found</p>
        )}
        {skills.map(skill=>(

          <div
            key={skill.id}
            className="border p-3 rounded cursor-pointer hover:bg-gray-100"
            onClick={()=>navigate(`/skills/${skill.id}`)}
          >
            <h3 className="font-bold">{skill.title}</h3>
            <p>{skill.owner_name || "User"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}