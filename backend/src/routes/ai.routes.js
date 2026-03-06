import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();
router.get("/recommendations",authenticate, async(req,res)=>{

try{

const userId = req.user.id;

const userSkills = await pool.query(
`SELECT s.tags
FROM skill_detail sd
JOIN skills s ON s.id = sd.skill_id
WHERE sd.user_id = $1`,
[userId]
);

const tagSet = new Set();

userSkills.rows.forEach(row=>{
if(row.tags){
row.tags.split(",").forEach(tag=>{
tagSet.add(tag.trim().toLowerCase());
});
}
});

const tags = Array.from(tagSet);

const skills = await pool.query(
`SELECT id,title,tags FROM skills`
);

const scored = skills.rows.map(skill=>{

let score = 0;

if(skill.tags){

skill.tags.split(",").forEach(tag=>{

if(tags.includes(tag.trim().toLowerCase())){
score++;
}

});

}

return {...skill,score};

});

scored.sort((a,b)=>b.score-a.score);

res.json(scored.slice(0,5));

}catch(err){

console.error(err);

res.status(500).json({message:"AI recommendation failed"});

}

});

export default router;