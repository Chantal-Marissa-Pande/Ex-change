import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import socket from "../socket";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [topSkills, setTopSkills] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [range, setRange] = useState("7d");

  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [
        statsRes,
        analyticsRes,
        topUsersRes,
        topSkillsRes,
        usersRes,
      ] = await Promise.all([
        axios.get("/api/admin/stats", { headers }),
        axios.get(`/api/admin/analytics/exchange-status?range=${range}`, {
          headers,
        }),
        axios.get("/api/admin/analytics/top-users", { headers }),
        axios.get("/api/admin/analytics/top-skills", { headers }),
        axios.get("/api/admin/users", { headers }),
      ]);

      setStats(statsRes.data || {});
      setAnalytics(analyticsRes.data || []);
      setTopUsers(topUsersRes.data || []);
      setTopSkills(topSkillsRes.data || []);
      setUsers(usersRes.data || []);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setError("Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  /* ================= REAL TIME ================= */
  useEffect(() => {
    fetchData();

    socket.on("dashboard:update", fetchData);

    return () => socket.off("dashboard:update", fetchData);
  }, [fetchData]);

  /* ================= USER ACTIONS ================= */
  const createUser = async () => {
    await axios.post("/api/admin/users", newUser, { headers });
    setShowModal(false);
    setNewUser({ name: "", email: "", password: "", role: "user" });
    fetchData();
  };

  const toggleStatus = async (id, currentStatus) => {
    await axios.patch(
      `/api/admin/users/${id}/status`,
      {
        status: currentStatus === "active" ? "suspended" : "active",
      },
      { headers }
    );

    fetchData();
  };

  const deleteUser = async (id) => {
    await axios.delete(`/api/admin/users/${id}`, { headers });
    fetchData();
  };

  /* ================= STATS ================= */
  const completionRate =
    stats.total_exchanges > 0
      ? Math.round(
          (stats.completed_exchanges / stats.total_exchanges) * 100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">
              Last updated: {lastUpdated || "—"}
            </p>
          </div>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-5 gap-4">
          <Stat title="Users" value={stats.total_users} />
          <Stat title="Listings" value={stats.total_listings} />
          <Stat title="Exchanges" value={stats.total_exchanges} />
          <Stat title="Completed" value={stats.completed_exchanges} />
          <Stat title="Success %" value={`${completionRate}%`} highlight />
        </div>

        {/* ================= ANALYTICS ================= */}
        <div className="grid grid-cols-2 gap-6">

          {/* PIE CHART */}
          <Card title="Exchange Distribution">
            <Chart>
              <PieChart>
                <Pie
                  data={analytics}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={100}
                >
                  {analytics.map((_, i) => (
                    <Cell key={i} fill="#3b82f6" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </Chart>
          </Card>

          {/* BAR CHART */}
          <Card title="Status Breakdown">
            <Chart>
              <BarChart data={analytics}>
                <CartesianGrid />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </Chart>
          </Card>

        </div>

        {/* ================= TOP USERS & SKILLS ================= */}
        <div className="grid grid-cols-2 gap-6">

          <Card title="Top Users">
            {topUsers.map((u, i) => (
              <Row
                key={u.id}
                left={`${i + 1}. ${u.name}`}
                right={u.exchanges_count}
              />
            ))}
          </Card>

          <Card title="Top Skills">
            {topSkills.map((s, i) => (
              <Row
                key={i}
                left={`${i + 1}. ${s.title}`}
                right={s.usage_count}
              />
            ))}
          </Card>

        </div>

        {/* ================= USER MANAGEMENT ================= */}
        <Card title="User Management">

          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">All Users</h3>

            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-3 py-1 rounded"
            >
              + Add User
            </button>
          </div>

          {users.map((u) => (
            <div
              key={u.id}
              className="flex justify-between py-3 border-b"
            >

              {/* INFO */}
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-400">
                  {u.role}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">

                {/* ACTIVATE / DEACTIVATE */}
                <button
                  onClick={() =>
                    toggleStatus(u.id, u.status || "active")
                  }
                  className={`px-3 py-1 text-sm rounded text-white ${
                    u.status === "active"
                      ? "bg-yellow-500"
                      : "bg-green-600"
                  }`}
                >
                  {u.status === "active"
                    ? "Deactivate"
                    : "Activate"}
                </button>

                {/* DELETE */}
                <button
                  onClick={() => deleteUser(u.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Delete
                </button>

              </div>
            </div>
          ))}
        </Card>

        {/* ================= ADD USER MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-[400px] space-y-3">

              <h2 className="text-xl font-bold">Add User</h2>

              <input
                className="border p-2 w-full"
                placeholder="Name"
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />

              <input
                className="border p-2 w-full"
                placeholder="Email"
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />

              <input
                className="border p-2 w-full"
                type="password"
                placeholder="Password"
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />

              <button
                onClick={createUser}
                className="bg-green-600 text-white px-3 py-1"
              >
                Create
              </button>

              <button onClick={() => setShowModal(false)}>
                Cancel
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ================= UI COMPONENTS ================= */

const Card = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Stat = ({ title, value, highlight }) => (
  <div
    className={`p-4 rounded shadow ${
      highlight ? "bg-indigo-600 text-white" : "bg-white"
    }`}
  >
    <p className="text-sm">{title}</p>
    <p className="text-xl font-bold">{value || 0}</p>
  </div>
);

const Row = ({ left, right }) => (
  <div className="flex justify-between py-2 border-b">
    <span>{left}</span>
    <span className="text-slate-500">{right}</span>
  </div>
);

const Chart = ({ children }) => (
  <div className="h-64">
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
);

export default AdminDashboard;