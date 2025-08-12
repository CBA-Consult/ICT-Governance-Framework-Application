"use client";
import React, { useEffect, useState } from "react";

const DefenderActivitiesDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:4000/api/defender-activities");
        if (!res.ok) throw new Error("Failed to fetch activities");
        const data = await res.json();
        setActivities(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Defender for Cloud Apps Activities</h1>
      {loading && <div>Loading activities...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Timestamp</th>
                <th className="px-4 py-2 border-b">Event Type</th>
                <th className="px-4 py-2 border-b">User</th>
                <th className="px-4 py-2 border-b">App Name</th>
                <th className="px-4 py-2 border-b">Description</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a._id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b text-xs text-gray-700">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</td>
                  <td className="px-4 py-2 border-b text-xs">{a.event_type}</td>
                  <td className="px-4 py-2 border-b text-xs">{a.user_name}</td>
                  <td className="px-4 py-2 border-b text-xs">{a.app_name}</td>
                  <td className="px-4 py-2 border-b text-xs max-w-xs truncate" title={a.description}>{a.description}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">No activities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DefenderActivitiesDashboard;
