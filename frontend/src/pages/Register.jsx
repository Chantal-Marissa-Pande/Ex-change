import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Registration successful!");
      navigate("/dashboard");

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Registration failed";

      setError(message);
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      
      {/* LEFT SIDE (Branding) */}
      <div className="hidden md:flex flex-col justify-center bg-primary text-white p-12">
        <h1 className="text-4xl font-bold mb-4">Join Ex-change</h1>
        <p className="text-lg opacity-90">
          Share your skills. Learn from others. Grow together.
        </p>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md">

          <h2 className="text-xl font-bold text-primary mb-4 text-center">
            Create Account
          </h2>

          {error && (
            <p className="text-red-600 mb-3 text-center text-sm">
              {error}
            </p>
          )}

          <form className="space-y-3" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border p-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="mt-3 text-center text-xs">
            Already have an account?{" "}
            <span
              className="text-primary cursor-pointer font-medium"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}