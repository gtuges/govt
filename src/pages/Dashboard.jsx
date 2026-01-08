import React, { useState } from "react";
import {
  Target,
  CheckCircle,
  PieChart,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const departments = [
    {
      name: "Health",
      objectives: 4,
      activities: 12,
      budget: "$120,000",
      status: "on-track",
      progress: 75,
    },
    {
      name: "Education",
      objectives: 3,
      activities: 8,
      budget: "$85,000",
      status: "at-risk",
      progress: 55,
    },
    {
      name: "Infrastructure",
      objectives: 5,
      activities: 15,
      budget: "$250,000",
      status: "delayed",
      progress: 35,
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "on-track":
        return (
          <span className="status-badge green">
            <Check size={14} />
            On Track
          </span>
        );
      case "at-risk":
        return (
          <span className="status-badge amber">
            <AlertTriangle size={14} />
            At Risk
          </span>
        );
      case "delayed":
        return (
          <span className="status-badge red">
            <AlertTriangle size={14} />
            Delayed
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case "on-track":
        return "#10b981";
      case "at-risk":
        return "#f59e0b";
      case "delayed":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card objectives-card">
          <div className="stat-icon-wrapper blue">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <h3>Total Objectives</h3>
            <p className="stat-value">12</p>
            <span className="stat-trend positive">+2 this month</span>
          </div>
        </div>

        <div className="stat-card activities-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>Active Activities</h3>
            <p className="stat-value">24</p>
            <span className="stat-trend neutral">
              <Check size={14} />
              On track
            </span>
          </div>
        </div>

        <div className="stat-card budget-card">
          <div className="stat-icon-wrapper orange">
            <PieChart size={20} />
          </div>
          <div className="stat-content">
            <h3>Budget Utilized</h3>
            <p className="stat-value">45%</p>
            <span className="stat-trend neutral">Within limits</span>
          </div>
        </div>

        <div className="stat-card approvals-card">
          <div className="stat-icon-wrapper red">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>Pending Approvals</h3>
            <p className="stat-value">5</p>
            <span className="stat-trend negative">Action needed</span>
          </div>
        </div>
      </div>

      {/* Progress by Department - Basic Table */}
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
              {departments.map((dept, index) => (
                <tr key={index}>
                  <td className="dept-name">{dept.name}</td>
                  <td>
                    <span className="objective-badge">{dept.objectives}</span>
                  </td>
                  <td>{dept.activities}</td>
                  <td>{dept.budget}</td>
                  <td>{getStatusBadge(dept.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress by Department - With Progress Bars */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Progress by Department</h2>
          <div className="section-nav">
            <button
              className="nav-arrow"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="nav-arrow"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table with-progress">
            <thead>
              <tr>
                <th>Department</th>
                <th>Objectives</th>
                <th>Activities</th>
                <th>Budget</th>
                <th></th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={index}>
                  <td className="dept-name">{dept.name}</td>
                  <td>
                    <span className="objective-badge">{dept.objectives}</span>
                  </td>
                  <td>{dept.activities}</td>
                  <td>{dept.budget}</td>
                  <td className="progress-cell">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${dept.progress}%`,
                          backgroundColor: getProgressColor(dept.status),
                        }}
                      />
                    </div>
                  </td>
                  <td>{getStatusBadge(dept.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
