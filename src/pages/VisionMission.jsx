import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import "./VisionMission.css";

const VisionMission = () => {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMissions = () => {
    fetch("http://localhost:3000/api/department-plans")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      })
      .then((data) => {
        setMissions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching missions:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleStatusChange = async (missionId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/department-plans/${missionId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      showNotification("Mission status updated successfully", "success");
      fetchMissions(); // Refresh the list
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("Failed to update status", "error");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="vision-mission-container">
      <div className="page-header">
        <h2>Mission Statements</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/create-mission")}
        >
          Add New Mission
        </button>
      </div>

      {missions.length === 0 ? (
        <div className="empty-state">
          No missions found. Create one to get started.
        </div>
      ) : (
        <div className="missions-table-container">
          <div className="info-banner">
            <strong>Note:</strong> Only missions with "Active" status allow branch heads
            to create activities, budgets, and timelines against the strategic objectives.
          </div>
          <table className="missions-table">
            <thead>
              <tr>
                <th>Mission Statement</th>
                <th>Vision</th>
                <th>Planning Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id}>
                  <td className="mission-text">{mission.mission}</td>
                  <td className="vision-text">{mission.vision}</td>
                  <td className="period-dates">
                    <div>{mission.startDate}</div>
                    <div className="to-separator">to</div>
                    <div>{mission.endDate}</div>
                  </td>
                  <td>
                    <select
                      className={`status-select status-${mission.status.toLowerCase()}`}
                      value={mission.status}
                      onChange={(e) =>
                        handleStatusChange(mission.id, e.target.value)
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() =>
                        navigate(`/objectives?missionId=${mission.id}`)
                      }
                    >
                      View Objectives
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VisionMission;
