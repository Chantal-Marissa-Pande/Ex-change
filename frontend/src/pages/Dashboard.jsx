import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, requestsRes] = await Promise.all([
          api.get("/api/user/me"),        // singular "user"
          api.get("/api/user/requests"),  // singular "user" and added route
        ]);

        setUser(userRes.data);
        setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      const res = await api.post("/api/user/add-skill", { skill: newSkill });
      setUser((prev) => ({ ...prev, skills: res.data.skills }));
      setNewSkill("");
    } catch (err) {
      console.error(err);
      setError("Failed to add skill. Please try again.");
    }
  };

  const handleRequest = async (requestId, action) => {
    setProcessingRequestId(requestId);
    try {
      await api.post(`/api/requests/${requestId}/${action}`); // keep this if you later create /api/requests/:id/accept/reject
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
      alert("Failed to process request. Try again.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return <div className="text-center p-8 text-red-600 font-semibold">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-primary text-center mb-4">
          Welcome, {user?.name || "User"}
        </h1>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-6">
          {["profile", "addSkill", "requests"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-text"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "profile"
                ? "Profile"
                : tab === "addSkill"
                ? "Add Skill"
                : "Requests"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <section className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-semibold text-text mb-2">Profile</h2>
            <p className="text-text mb-1">
              <span className="font-medium">Email:</span> {user?.email || "-"}
            </p>
            <p className="text-text">
              <span className="font-medium">Skills:</span>{" "}
              {user?.skills?.length ? user.skills.join(", ") : "No skills yet"}
            </p>
          </section>
        )}

        {activeTab === "addSkill" && (
          <section className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-semibold text-text mb-2">Add a Skill</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter a skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={addSkill}
                className="bg-primary text-white px-4 rounded-md hover:bg-green-700 transition"
              >
                Add
              </button>
            </div>
          </section>
        )}

        {activeTab === "requests" && (
          <section className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-semibold text-text mb-2">
              Incoming Requests
            </h2>
            {Array.isArray(requests) && requests.length ? (
              <ul className="space-y-2">
                {requests.map((req) => (
                  <li
                    key={req.id}
                    className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
                  >
                    <span>
                      <span className="font-medium">{req.requester}</span> is requesting:{" "}
                      {req.skill}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                        onClick={() => handleRequest(req.id, "accept")}
                        disabled={processingRequestId === req.id}
                      >
                        Accept
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                        onClick={() => handleRequest(req.id, "reject")}
                        disabled={processingRequestId === req.id}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text">No incoming requests yet.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}