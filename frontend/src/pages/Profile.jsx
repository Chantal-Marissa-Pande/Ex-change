import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Fetch user info
        const userRes = await api.get(`/api/user/${userId}`);
        setUser(userRes.data);

        // Fetch incoming requests
        const incomingRes = await api.get(`/api/user/${userId}/requests/incoming`);
        setIncomingRequests(incomingRes.data || []);

        // Fetch outgoing requests
        const outgoingRes = await api.get(`/api/user/${userId}/requests/outgoing`);
        setOutgoingRequests(outgoingRes.data || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) return <div className="p-10 text-center">Loading profile…</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!user) return <div className="p-10 text-center text-gray-500">User not found.</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <button
        className="mb-6 text-primary underline"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
        <p className="text-gray-600 mb-1"><strong>Email:</strong> {user.email}</p>
        <p className="text-gray-600">
          <strong>Skills:</strong>{" "}
          {user.skills?.length ? user.skills.join(", ") : "None yet"}
        </p>
      </section>

      {/* Incoming Requests */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
        {incomingRequests.length ? (
          <ul className="space-y-2">
            {incomingRequests.map((r) => (
              <li
                key={r.id}
                className="flex justify-between bg-gray-100 p-4 rounded-lg"
              >
                <span>
                  <strong>{r.requester}</strong> wants <em>{r.skill}</em>
                </span>
                <span className="text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No incoming requests.</p>
        )}
      </section>

      {/* Outgoing Requests */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Outgoing Requests</h2>
        {outgoingRequests.length ? (
          <ul className="space-y-2">
            {outgoingRequests.map((r) => (
              <li
                key={r.id}
                className="flex justify-between bg-gray-100 p-4 rounded-lg"
              >
                <span>
                  Requested <em>{r.skill}</em> from <strong>{r.recipient}</strong>
                </span>
                <span className="text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No outgoing requests.</p>
        )}
      </section>
    </div>
  );
}