import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateMission.css"; // Reusing form styles

const EditActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [objectives, setObjectives] = useState([]);
  const [formData, setFormData] = useState({
    objectiveId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch objectives
    fetch("http://localhost:3000/api/objectives")
      .then((res) => res.json())
      .then((data) => setObjectives(data))
      .catch((err) => console.error("Error fetching objectives:", err));

    // Fetch activity details
    fetch(`http://localhost:3000/api/activities/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activity details");
        return res.json();
      })
      .then((data) => {
        setFormData({
          objectiveId: data.objectiveId,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
        });
      })
      .catch((err) => {
        console.error("Error fetching activity:", err);
        setError(err.message);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/activities/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update activity");
      }

      navigate("/activities");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-mission-container">
      <div className="page-header">
        <h2>Edit Activity</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-mission-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="objectiveId">Link to Strategic Objective</label>
          <select
            id="objectiveId"
            name="objectiveId"
            value={formData.objectiveId}
            onChange={handleChange}
            required
          >
            <option value="">Select Objective</option>
            {objectives.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.objective_text.substring(0, 100)}...
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">Activity Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter activity title..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Describe the activity..."
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/activities")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditActivity;
