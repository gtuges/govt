import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateMission.css"; // Reusing form styles

const CreateObjective = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    planId: "",
    objective: "",
    narrative: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch active plans (missions) to link the objective to
    fetch("http://localhost:3000/api/department-plans")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch((err) => console.error("Error fetching plans:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create objective");
      }

      navigate("/objectives");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-mission-container">
      <div className="page-header">
        <h2>Create Strategic Objective</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-mission-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="planId">Link to Mission (Department Plan)</label>
          <select
            id="planId"
            name="planId"
            value={formData.planId}
            onChange={handleChange}
            required
          >
            <option value="">Select Mission</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.mission.substring(0, 100)}...
              </option>
            ))}
          </select>
          <small style={{ color: "#64748b", marginTop: "4px" }}>
            Select the department mission this objective supports.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="objective">Objective</label>
          <textarea
            id="objective"
            name="objective"
            value={formData.objective}
            onChange={handleChange}
            required
            rows="3"
            placeholder="Enter the strategic objective..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="narrative">Narrative / Justification</label>
          <textarea
            id="narrative"
            name="narrative"
            value={formData.narrative}
            onChange={handleChange}
            required
            rows="5"
            placeholder="Explain how this objective supports the mission and vision..."
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/objectives")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Objective"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateObjective;
