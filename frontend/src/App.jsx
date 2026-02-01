import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx"; // Updated import
import Skills from "./pages/Skills.jsx";
import SkillDetail from "./pages/SkillDetail.jsx";

export default function App() {
  const token = localStorage.getItem("token");

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard token={token} />
            </ProtectedRoute>
          }
        />

        {/* Public Skills page (view all skills) */}
        <Route path="/skills" element={<Skills />} />
        <Route path="/skills/:skillId" element={<SkillDetail token={token} />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}