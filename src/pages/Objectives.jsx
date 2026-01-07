import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFiscalYear } from "../context/FiscalYearContext";
import "./Objectives.css";

const Objectives = () => {
  const navigate = useNavigate();
  const { selectedYear } = useFiscalYear();
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch objectives when year changes
  useEffect(() => {
    setLoading(true);
    const url = selectedYear
      ? `http://localhost:3000/api/objectives?year=${selectedYear}`
      : "http://localhost:3000/api/objectives";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch objectives");
        return res.json();
      })
      .then((data) => {
        setObjectives(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [selectedYear]);

  // Group objectives by mission
  const groupedByMission = objectives.reduce((acc, obj) => {
    const mission = obj.mission || "No Mission";
    if (!acc[mission]) {
      acc[mission] = [];
    }
    acc[mission].push(obj);
    return acc;
  }, {});

  // Calculate grand totals
  const grandTotalEstimated = objectives.reduce(
    (sum, obj) => sum + Number(obj.estimated_budget || 0),
    0
  );
  const grandTotalActual = objectives.reduce(
    (sum, obj) => sum + Number(obj.actual_expenditure || 0),
    0
  );
  const totalActivities = objectives.reduce(
    (sum, obj) => sum + Number(obj.activity_count || 0),
    0
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate variance percentage
  const getVarianceClass = (estimated, actual) => {
    if (estimated === 0) return "";
    const percent = ((actual - estimated) / estimated) * 100;
    if (percent > 10) return "variance-over";
    if (percent < -10) return "variance-under";
    return "variance-ok";
  };

  if (loading)
    return <div className="loading-state">Loading objectives...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="objectives-container">
      <div className="page-header">
        <div className="header-left">
          <h2>Strategic Objectives</h2>
          <span className="page-year-badge">FY {selectedYear}</span>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/create-objective")}
        >
          Add New Objective
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon objectives-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{objectives.length}</span>
            <span className="summary-label">Objectives</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon activities-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{totalActivities}</span>
            <span className="summary-label">Activities</span>
          </div>
        </div>
        <div className="summary-card estimated-card">
          <div className="summary-icon budget-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="15" y2="16" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {formatCurrency(grandTotalEstimated)}
            </span>
            <span className="summary-label">Estimated Budget</span>
          </div>
        </div>
        <div className="summary-card actual-card">
          <div className="summary-icon actual-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {formatCurrency(grandTotalActual)}
            </span>
            <span className="summary-label">Actual Expenditure</span>
          </div>
        </div>
      </div>

      {objectives.length === 0 ? (
        <div className="empty-state">
          No objectives found{selectedYear ? ` for FY ${selectedYear}` : ""}.
          Create one to get started.
        </div>
      ) : (
        <div className="objectives-table-container">
          {Object.entries(groupedByMission).map(
            ([mission, missionObjectives]) => {
              const missionEstimated = missionObjectives.reduce(
                (sum, obj) => sum + Number(obj.estimated_budget || 0),
                0
              );
              const missionActual = missionObjectives.reduce(
                (sum, obj) => sum + Number(obj.actual_expenditure || 0),
                0
              );
              const missionActivities = missionObjectives.reduce(
                (sum, obj) => sum + Number(obj.activity_count || 0),
                0
              );

              return (
                <div key={mission} className="mission-section">
                  <div className="mission-header">
                    <div className="mission-info">
                      <h3>Mission: {mission}</h3>
                      <span className="objectives-count">
                        {missionObjectives.length} objective
                        {missionObjectives.length !== 1 ? "s" : ""} •{" "}
                        {missionActivities} activities
                      </span>
                    </div>
                    <div className="mission-budget">
                      <div className="mission-budget-row">
                        <span className="mission-budget-label">Estimated:</span>
                        <span className="mission-budget-value">
                          {formatCurrency(missionEstimated)}
                        </span>
                      </div>
                      <div className="mission-budget-row">
                        <span className="mission-budget-label">Actual:</span>
                        <span className="mission-budget-value actual">
                          {formatCurrency(missionActual)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <table className="objectives-table">
                    <thead>
                      <tr>
                        <th>Strategic Objective</th>
                        <th>Department</th>
                        <th>Activities</th>
                        <th>Estimated Budget</th>
                        <th>Actual Expenditure</th>
                        <th>Variance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missionObjectives.map((obj) => {
                        const estimated = Number(obj.estimated_budget || 0);
                        const actual = Number(obj.actual_expenditure || 0);
                        const variance = estimated - actual;
                        const variancePercent =
                          estimated > 0
                            ? ((variance / estimated) * 100).toFixed(1)
                            : 0;

                        return (
                          <tr key={obj.id}>
                            <td className="objective-title">
                              <div className="objective-title-text">
                                {obj.objective_text}
                              </div>
                              <div className="objective-narrative-hint">
                                {obj.narrative}
                              </div>
                            </td>
                            <td>
                              <span className="department-tag">
                                {obj.department_name}
                              </span>
                            </td>
                            <td className="activity-count-cell">
                              <span className="activity-badge">
                                {obj.activity_count || 0}
                              </span>
                            </td>
                            <td className="budget-cell estimated">
                              {formatCurrency(estimated)}
                            </td>
                            <td className="budget-cell actual">
                              {formatCurrency(actual)}
                            </td>
                            <td
                              className={`variance-cell ${getVarianceClass(
                                estimated,
                                actual
                              )}`}
                            >
                              <div className="variance-amount">
                                {variance >= 0 ? "+" : ""}
                                {formatCurrency(variance)}
                              </div>
                              {estimated > 0 && (
                                <div className="variance-percent">
                                  {variance >= 0 ? "▲" : "▼"}{" "}
                                  {Math.abs(variancePercent)}%
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${obj.status
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {obj.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() =>
                                  navigate(`/edit-objective/${obj.id}`)
                                }
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="mission-subtotal-row">
                        <td colSpan="3" className="subtotal-label">
                          Mission Subtotal
                        </td>
                        <td className="subtotal-value">
                          {formatCurrency(missionEstimated)}
                        </td>
                        <td className="subtotal-value actual">
                          {formatCurrency(missionActual)}
                        </td>
                        <td
                          className={`subtotal-value ${getVarianceClass(
                            missionEstimated,
                            missionActual
                          )}`}
                        >
                          {formatCurrency(missionEstimated - missionActual)}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            }
          )}

          {/* Grand Total Footer */}
          <div className="grand-total-bar">
            <div className="grand-total-content">
              <div className="grand-total-left">
                <span className="grand-total-label">
                  Grand Total ({objectives.length} objectives, {totalActivities}{" "}
                  activities)
                </span>
              </div>
              <div className="grand-total-right">
                <div className="grand-total-item">
                  <span className="grand-total-sublabel">Estimated</span>
                  <span className="grand-total-value">
                    {formatCurrency(grandTotalEstimated)}
                  </span>
                </div>
                <div className="grand-total-item">
                  <span className="grand-total-sublabel">Actual</span>
                  <span className="grand-total-value actual">
                    {formatCurrency(grandTotalActual)}
                  </span>
                </div>
                <div className="grand-total-item variance">
                  <span className="grand-total-sublabel">Variance</span>
                  <span
                    className={`grand-total-value ${getVarianceClass(
                      grandTotalEstimated,
                      grandTotalActual
                    )}`}
                  >
                    {formatCurrency(grandTotalEstimated - grandTotalActual)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Objectives;
