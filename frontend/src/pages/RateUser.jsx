import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function RateUser({exchangeId, ratedUser}){
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");

  const submit=async()=>{

    try{
      await api.post("/ratings",{
        exchange_id:exchangeId,
        rated_user_id:ratedUser,
        rating,
        comment
      });
      toast.success("Rating submitted");
    }catch{
      toast.error("Failed to rate");
    }
  };

  return(
    <div className="border p-3 rounded mt-3">
      <h3 className="font-bold">Rate this exchange</h3>
      <select
        value={rating}
        onChange={e=>setRating(e.target.value)}
        className="border p-1 mt-2"
      >
        {[1,2,3,4,5].map(n=>(
          <option key={n}>{n}</option>
        ))}
      </select>
      <textarea
        placeholder="Comment"
        value={comment}
        onChange={e=>setComment(e.target.value)}
        className="border p-2 w-full mt-2"
      />
      <button
        onClick={submit}
        className="bg-blue-600 text-white px-3 py-1 mt-2"
      >
        Submit
      </button>
    </div>
  );
}