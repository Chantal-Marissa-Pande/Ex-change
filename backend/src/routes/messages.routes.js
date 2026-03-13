import express from "express";
import pool from "../config/db.js";
import authenticate from "../middleware/authenticate.js";
import { io } from "../server.js";

const router = express.Router();

/* GET messages for exchange */
router.get("/:exchangeId", authenticate, async (req,res)=>{
  try{
    const {exchangeId}=req.params;

    const {rows}=await pool.query(
      `SELECT 
        m.id,
        m.exchange_id,
        m.sender_id,
        m.content,
        m.created_at,
        u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id=m.sender_id
       WHERE m.exchange_id=$1
       ORDER BY m.created_at ASC`,
      [exchangeId]
    );
    res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Failed to fetch messages"});
  }
});

/* SEND message */
router.post("/:exchangeId", authenticate, async (req,res)=>{
  try{
    const {exchangeId}=req.params;
    const {content}=req.body;
    const userId=req.user.id;
    if(!content?.trim()){
      return res.status(400).json({message:"Message required"});
    }
    const result=await pool.query(
      `INSERT INTO messages(exchange_id,sender_id,content)
       VALUES($1,$2,$3)
       RETURNING *`,
      [exchangeId,userId,content]
    );
    const message=result.rows[0];

    const userRes=await pool.query(
      `SELECT name FROM users WHERE id=$1`,
      [userId]
    );
    message.sender_name=userRes.rows[0].name;
    io.to(`exchange_${exchangeId}`).emit("receiveMessage",message);
    res.status(201).json(message);
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Failed to send message"});
  }
});

export default router;