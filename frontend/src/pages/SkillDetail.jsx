import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function SkillDetail({ currentUser }) {
  const { skillId } = useParams();
  const navigate = useNavigate();

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [canRate, setCanRate] = useState(false);
  const [newRating, setNewRating] = useState({ rating: 5, comment: "" });

  const fetchSkill = async () => {
    try {
      const res = await api.get(`/skills/${skillId}`);
      const data = res.data;

      data.tags = Array.isArray(data.tags) ? data.tags.map(t=>t.replace(/[^\w\s]/g,"").trim()) : data.tags?.split(",").map(t=>t.replace(/[^\w\s]/g,"").trim()) || [];
      data.ratings = data.ratings || [];
      setSkill(res.data);
    } catch(err) {
      console.error("Skill fetch error:", err);
      toast.error("Failed to load skill");
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchSkill(); }, [skillId]);

  useEffect(() => {
    async function checkCompletion (){
      try {
        const res = await api.get("/exchanges/my");

        const completed = res.data.find(
          (ex) =>
            ex.listing_id === skill?.listing_id &&
          ex.status === "completed"
        );

        setCanRate(!!completed);
      } catch {}
    }

    if (skill?.listing_id) checkCompletion();
  }, [skill]);

  const sendRequest = async () => {
    if (!skill?.listing_id) { 
      toast.error("This skill has no active listing"); 
      return; 
    }

    try {
      await api.post("/exchanges", { 
        listing_id: skill.listing_id, message 
      });

      toast.success("Request sent successfully!");
      navigate("/dashboard")

    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const submitRating = async () => {
    try {
      await api.post("/rating",{
        exchange_id: skill.exchange_id,
        score: newRating.rating,
        comment: newRating.comment,
      });

      toast.success("Rating submitted!");
      setNewRating({rating: 5, comment: ""});
    } catch {
      toast.error("Failed to submit rating");
    }
  };


  if(loading) return <div className="p-10 text-center">Loading skill…</div>;
  if(!skill) return <div className="p-10 text-center">Skill not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={()=>navigate(-1)} className="text-primary mb-4">← Back</button>

      <h1 className="text-2xl font-bold">{skill.title}</h1>
      <p>By {skill.owner_name}</p>

      <div className="flex gap-2 mt-2 flex-wrap">
        {skill.tags.map((t,i)=>
          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {t}
            </span>
          )}
          </div>

      <h2 className="mt-6 font-semibold">Request this skill</h2>
      <div className="flex gap-2 mt-2">
        <input 
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Optional message"
          className="border p-2 flex-1 rounded"
          />
        <button onClick={sendRequest} className="bg-blue-600 text-white px-4 py-2 rounded">
          Send Request
        </button>
      </div>

      {canRate &&
        <>
          <h2 className="mt-6 font-semibold">Rate this skill</h2>
          <select
            value={newRating.rating}
            onChange={(e)=>
              setNewRating(p=>({...p,rating:Number(e.target.value)}))}
              className="border p-2 rounded"
              >
          {[5,4,3,2,1].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>

        <input
        value={newRating.comment}
        onChange={(e)=>
          setNewRating(p=>({...p,comment:e.target.value}))}
        placeholder="Comment" className="border p-2 mt-2 w-full rounded"
        />

        <button onClick={submitRating} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
          Submit Rating
        </button>
      </>}

      {skill.ratings.length>0 && <div className="mt-6">
        <h3 className="font-semibold mb-2">Ratings</h3>
        <ul className="space-y-2">{skill.ratings.map(r=>(
          <li key={r.id} className="border p-2 rounded">⭐ {r.rating} - {r.comment || "No comment"} by {r.rater_name}</li>
        ))}</ul>
      </div>}
    </div>
  );
}