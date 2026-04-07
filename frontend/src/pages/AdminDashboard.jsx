import { useEffect, useState } from "react";
import axios from "axios";
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
  const [users, setUsers] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, exchangesRes, analyticsRes] =
        await Promise.all([
          axios.get("/api/admin/stats", { headers }),
          axios.get("/api/admin/users", { headers }),
          axios.get("/api/admin/exchanges", { headers }),
          axios.get("/api/admin/analytics/exchange-status", { headers }),
        ]);

      setStats(statsRes.data || {});
      setUsers(usersRes.data || []);
      setExchanges(exchangesRes.data || []);

      // ✅ normalize analytics
      const normalized = (analyticsRes.data || []).map((a) => ({
        status: a.status,
        count: Number(a.count),
      }));

      setAnalytics(normalized);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    completed: "#22c55e",
    pending: "#eab308",
    rejected: "#ef4444",
    accepted: "#3b82f6",
  };

  const completionRate =
    stats.total_exchanges > 0
      ? Math.round(
          (stats.completed_exchanges / stats.total_exchanges) * 100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-10">Admin Dashboard</h1>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard title="Users" value={stats.total_users} />
          <StatCard title="Listings" value={stats.total_listings} />
          <StatCard title="Exchanges" value={stats.total_exchanges} />
          <StatCard title="Completed" value={stats.completed_exchanges} />
          <StatCard title="Completion %" value={`${completionRate}%`} />
        </div>

        {/* ================= CHARTS ================= */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Pie Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Exchange Status Distribution
            </h2>

            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analytics}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={120}
                    label
                  >
                    {analytics.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={statusColors[entry.status] || "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Exchange Status Counts
            </h2>

            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ================= USERS ================= */}
        <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg mb-12">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Users</h2>

            <input
              placeholder="Search users..."
              className="px-4 py-2 rounded bg-slate-700 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <table className="w-full text-left">
            <thead className="text-slate-400 border-b border-slate-600">
              <tr>
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700">
                    <td className="py-3">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= EXCHANGES ================= */}
        <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Exchanges</h2>

          <table className="w-full text-left">
            <thead className="text-slate-400 border-b border-slate-600">
              <tr>
                <th className="py-3">ID</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {exchanges.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-400">
                    No exchanges yet
                  </td>
                </tr>
              ) : (
                exchanges.map((ex) => (
                  <tr key={ex.id} className="border-b border-slate-700">
                    <td className="py-3">{ex.id}</td>
                    <td>{ex.requester_name}</td>
                    <td
                      className="capitalize"
                      style={{
                        color: statusColors[ex.status] || "#fff",
                      }}
                    >
                      {ex.status}
                    </td>
                    <td>
                      {new Date(ex.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-slate-800/60 rounded-xl p-6 shadow-lg">
    <h3 className="text-slate-400 text-sm">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value || 0}</p>
  </div>
);

export default AdminDashboard;