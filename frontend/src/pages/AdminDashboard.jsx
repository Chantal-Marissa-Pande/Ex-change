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
  const [analytics, setAnalytics] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [topSkills, setTopSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, analyticsRes, usersTopRes, skillsRes] =
        await Promise.all([
          axios.get("/api/admin/stats", { headers }),
          axios.get("/api/admin/analytics/exchange-status", { headers }),
          axios.get("/api/admin/analytics/top-users", { headers }),
          axios.get("/api/admin/analytics/top-skills", { headers }),
        ]);

      setStats(statsRes.data || {});
      setAnalytics(
        (analyticsRes.data || []).map((a) => ({
          status: a.status,
          count: Number(a.count),
        }))
      );
      setTopUsers(usersTopRes.data || []);
      setTopSkills(skillsRes.data || []);
    } catch (err) {
      console.error("Admin error:", err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
          <div className="text-sm text-slate-500">
            Real-time system insights
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <StatCard title="Users" value={stats.total_users} />
          <StatCard title="Listings" value={stats.total_listings} />
          <StatCard title="Exchanges" value={stats.total_exchanges} />
          <StatCard title="Completed" value={stats.completed_exchanges} />
          <StatCard
            title="Success Rate"
            value={`${completionRate}%`}
            highlight
          />
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* PIE */}
          <Card title="Exchange Distribution">
            {analytics.length === 0 ? (
              <EmptyState text="No exchange data" />
            ) : (
              <ChartWrapper>
                <PieChart>
                  <Pie
                    data={analytics}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={100}
                  >
                    {analytics.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={statusColors[entry.status]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartWrapper>
            )}
          </Card>

          {/* BAR */}
          <Card title="Status Breakdown">
            {analytics.length === 0 ? (
              <EmptyState text="No analytics data" />
            ) : (
              <ChartWrapper>
                <BarChart data={analytics}>
                  <CartesianGrid stroke="#e5e7eb" />
                  <XAxis dataKey="status" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ChartWrapper>
            )}
          </Card>

          {/* TOP USERS */}
          <Card title="Top Users">
            {topUsers.length === 0 ? (
              <EmptyState text="No user activity" />
            ) : (
              topUsers.map((u, i) => (
                <Row
                  key={u.id}
                  left={`${i + 1}. ${u.name}`}
                  right={`${u.exchanges_count}`}
                />
              ))
            )}
          </Card>
        </div>

        {/* LOWER */}
        <div className="grid lg:grid-cols-1 gap-6">
          <Card title="Popular Skills">
            {topSkills.length === 0 ? (
              <EmptyState text="No skill data" />
            ) : (
              topSkills.map((s, i) => (
                <Row
                  key={i}
                  left={`${i + 1}. ${s.title}`}
                  right={`${s.usage_count}`}
                />
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ================= UI ================= */

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition">
    <h2 className="text-lg font-semibold mb-4 text-slate-700">{title}</h2>
    {children}
  </div>
);

const StatCard = ({ title, value, highlight }) => (
  <div
    className={`rounded-2xl p-5 transition ${
      highlight
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
        : "bg-white border border-slate-200 shadow-md"
    }`}
  >
    <p className={`${highlight ? "text-white/80" : "text-slate-500"} text-sm`}>
      {title}
    </p>
    <h3 className="text-2xl font-bold mt-2">{value || 0}</h3>
  </div>
);

const Row = ({ left, right }) => (
  <div className="flex justify-between py-2 border-b border-slate-200">
    <span className="text-slate-700">{left}</span>
    <span className="text-slate-500">{right}</span>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="text-center text-slate-400 py-6">{text}</div>
);

const ChartWrapper = ({ children }) => (
  <div className="h-64">
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
);

export default AdminDashboard;