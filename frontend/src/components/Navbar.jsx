import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-primary text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Ex-change Logo" className="h-20" />
        <span className="font-bold text-xl">Ex-change</span>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/skills")}
          className="hover:underline"
        >
          Explore Skills
        </button>
        <button
          onClick={() => navigate("/login")}
          className="hover:underline"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/register")}
          className="hover:underline"
        >
          Register
        </button>
      </div>
    </nav>
  );
}