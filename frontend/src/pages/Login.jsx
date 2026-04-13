import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);

      toast.success("Login successful!");
      navigate(res.data.user.role === "admin" ? "/admin" : "/dashboard");

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed";

      setError(message);
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      
      <div className="hidden md:flex flex-col justify-center bg-primary text-white p-12">
        <h1 className="text-4xl font-bold mb-4">Ex-change</h1>
        <p className="text-lg opacity-90">
          Exchange skills. Build community. Grow together.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md">
          
          <h2 className="text-xl font-bold text-primary mb-4 text-center">
            Welcome Back
          </h2>

          {error && (
            <p className="text-red-600 mb-3 text-center text-sm">
              {error}
            </p>
          )}

          <form className="space-y-3" onSubmit={handleLogin}>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-3 text-center text-xs">
            Don't have an account?{" "}
            <span
              className="text-primary cursor-pointer font-medium"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}