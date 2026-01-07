import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Objectives</h3>
          <p className="stat-value">12</p>
          <span className="stat-trend positive">+2 this month</span>
        </div>
        <div className="stat-card">
          <h3>Active Activities</h3>
          <p className="stat-value">24</p>
          <span className="stat-trend neutral">On track</span>
        </div>
        <div className="stat-card">
          <h3>Budget Utilized</h3>
          <p className="stat-value">45%</p>
          <span className="stat-trend positive">Within limits</span>
        </div>
        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <p className="stat-value">5</p>
          <span className="stat-trend negative">Action needed</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Progress by Department</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Objectives</th>
                <th>Activities</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Health</td>
                <td>4</td>
                <td>12</td>
                <td>$120,000</td>
                <td>
                  <span className="status-badge green">On Track</span>
                </td>
              </tr>
              <tr>
                <td>Education</td>
                <td>3</td>
                <td>8</td>
                <td>$85,000</td>
                <td>
                  <span className="status-badge amber">At Risk</span>
                </td>
              </tr>
              <tr>
                <td>Infrastructure</td>
                <td>5</td>
                <td>15</td>
                <td>$250,000</td>
                <td>
                  <span className="status-badge red">Delayed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
