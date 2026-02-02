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
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch user info, requests, recommendations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [userRes, requestsRes, recRes] = await Promise.all([
          api.get("/api/user/me"),
          api.get("/api/user/requests").catch(() => []), // optional requests
          api.get("/api/user/recommendations"),
        ]);

        setUser(userRes.data);
        setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add a skill
  const addSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      const res = await api.post("/api/skills", { title: newSkill });
      setUser((prev) => ({
        ...prev,
        skills: prev.skills ? [...prev.skills, newSkill] : [newSkill],
      }));
      setNewSkill("");
    } catch (err) {
      console.error(err);
      setError("Failed to add skill.");
    }
  };

  // Handle search query
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const res = await api.get(`/api/skills/search?q=${query}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    fetchResults();
  }, [query]);

  // Handle request actions
  const handleRequest = async (requestId, action) => {
    setProcessingRequestId(requestId);
    try {
      await api.post(`/api/requests/${requestId}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
      alert("Failed to process request.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (loading)
    return <div className="text-center p-8">Loading dashboard...</div>;
  if (error)
    return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-primary text-center mb-4">
          Welcome, {user?.name || "User"}
        </h1>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-6">
          {["profile", "addSkill", "requests", "search"].map((tab) => (
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
                : tab === "requests"
                ? "Requests"
                : "Search"}
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
            {recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Recommended Skills:</h3>
                <ul className="list-disc pl-5">
                  {recommendations.map((rec) => (
                    <li key={rec.id}>{rec.title}</li>
                  ))}
                </ul>
              </div>
            )}
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

        {activeTab === "search" && (
          <section className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-semibold text-text mb-2">Search Skills</h2>
            <input
              type="text"
              placeholder="Search for skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            />
            {searchResults.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {searchResults.map((skill) => (
                  <li key={skill.id}>{skill.title}</li>
                ))}
              </ul>
            ) : (
              query && <p>No skills found.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}