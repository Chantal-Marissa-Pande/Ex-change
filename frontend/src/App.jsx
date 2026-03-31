import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SkillDetail from "./pages/SkillDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Skills from "./pages/Skills";
import { useEffect } from "react";
import socket from "./socket";

export default function App({currentUser}) {
  // Join personal room for real-time updates
  useEffect(() => {
    if (currentUser?.id) {
      socket.emit("join_user", currentUser.id);
      console.log("Joined personal room for user:", currentUser.id);
    }
  }, [currentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/skills/:skillId" element={<SkillDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}