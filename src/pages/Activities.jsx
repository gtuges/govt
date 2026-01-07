import React, { useState, useEffect } from "react";
import { format, parse, addDays, differenceInCalendarDays } from "date-fns";
import "./Activities.css";

const getRandomColor = () => {
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#f43f5e",
    "#64748b",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    objectiveId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: getRandomColor(),
    budget: [], // { categoryId, description, quantity, unitCost }
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("calendarViewMode") || "grid"
  );
  const [calendarFontSize, setCalendarFontSize] = useState(
    () => localStorage.getItem("calendarFontSize") || "normal"
  );

  useEffect(() => {
    localStorage.setItem("calendarViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("calendarFontSize", calendarFontSize);
  }, [calendarFontSize]);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, activity }
  const [activeTab, setActiveTab] = useState("calendar"); // "calendar" | "list" | "tree"

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Fetch activities, objectives, and budget categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, objectivesRes, budgetCatsRes] = await Promise.all(
          [
            fetch("http://localhost:3000/api/activities"),
            fetch("http://localhost:3000/api/objectives"),
            fetch("http://localhost:3000/api/activities/budget-categories"),
          ]
        );

        if (!activitiesRes.ok) throw new Error("Failed to fetch activities");
        if (!objectivesRes.ok) throw new Error("Failed to fetch objectives");
        // if (!budgetCatsRes.ok) throw new Error("Failed to fetch budget categories");

        const activitiesData = await activitiesRes.json();
        const objectivesData = await objectivesRes.json();
        const budgetCatsData = budgetCatsRes.ok
          ? await budgetCatsRes.json()
          : [];

        setActivities(activitiesData);
        setObjectives(objectivesData);
        setBudgetCategories(budgetCatsData);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      objectiveId: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      color: getRandomColor(),
      budget: [],
    });
    setIsEditing(false);
    setSelectedActivityId(null);
    setShowForm(false);
    setFormError(null);
    setFormSuccess(null);
    setAttachments([]);
  };

  const handleSelectActivity = async (activity) => {
    // Initial partial set
    setFormData({
      objectiveId: activity.id_objective || "",
      title: activity.activity_title,
      description: activity.activity_description,
      startDate: activity.startDate,
      endDate: activity.endDate,
      color: activity.color || "#3b82f6",
      budget: [],
    });

    setIsEditing(true);
    setSelectedActivityId(activity.id);
    setShowForm(true);
    setActiveTab("calendar");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fetch full details including budget
    try {
      const response = await fetch(
        `http://localhost:3000/api/activities/${activity.id}`
      );
      if (response.ok) {
        const fullActivity = await response.json();
        setFormData((prev) => ({
          ...prev,
          budget: fullActivity.budget || [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch activity details", err);
    }

    // Fetch attachments for this activity
    try {
      const filesRes = await fetch(
        `http://localhost:3000/api/activities/${activity.id}/files`
      );
      if (filesRes.ok) {
        const files = await filesRes.json();
        setAttachments(files);
      } else {
        setAttachments([]);
      }
    } catch (err) {
      console.error("Failed to fetch attachments", err);
      setAttachments([]);
    }
  };

  const handleBudgetChange = (index, field, value) => {
    const newBudget = [...formData.budget];
    newBudget[index] = { ...newBudget[index], [field]: value, isDirty: true };
    setFormData((prev) => ({ ...prev, budget: newBudget }));
  };

  const addBudgetLine = () => {
    setFormData((prev) => ({
      ...prev,
      budget: [
        ...prev.budget,
        {
          categoryId: "",
          description: "",
          quantity: 1,
          unitCost: 0,
          isNew: true,
          isDirty: true,
        },
      ],
    }));
  };

  const saveBudgetLine = async (index) => {
    const item = formData.budget[index];
    if (!item.categoryId) {
      alert("Please select a category");
      return;
    }

    try {
      if (item.isNew) {
        // Create new budget line
        const res = await fetch(
          `http://localhost:3000/api/activities/${selectedActivityId}/budget`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: item.categoryId,
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
            }),
          }
        );
        if (res.ok) {
          const saved = await res.json();
          const newBudget = [...formData.budget];
          newBudget[index] = { ...saved, isNew: false, isDirty: false };
          setFormData((prev) => ({ ...prev, budget: newBudget }));
        } else {
          alert("Failed to save budget line");
        }
      } else {
        // Update existing budget line
        const res = await fetch(
          `http://localhost:3000/api/activities/${selectedActivityId}/budget/${item.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: item.categoryId,
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
            }),
          }
        );
        if (res.ok) {
          const newBudget = [...formData.budget];
          newBudget[index] = { ...newBudget[index], isDirty: false };
          setFormData((prev) => ({ ...prev, budget: newBudget }));
        } else {
          alert("Failed to update budget line");
        }
      }
    } catch (err) {
      console.error("Error saving budget line:", err);
      alert("Error saving budget line");
    }
  };

  const deleteBudgetLine = async (index) => {
    const item = formData.budget[index];

    if (item.isNew) {
      // Just remove from local state if it's a new unsaved line
      const newBudget = formData.budget.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, budget: newBudget }));
      return;
    }

    if (!confirm("Are you sure you want to delete this budget line?")) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/activities/${selectedActivityId}/budget/${item.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const newBudget = formData.budget.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, budget: newBudget }));
      } else {
        alert("Failed to delete budget line");
      }
    } catch (err) {
      console.error("Error deleting budget line:", err);
      alert("Error deleting budget line");
    }
  };

  const removeBudgetLine = (index) => {
    const newBudget = formData.budget.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, budget: newBudget }));
  };

  const calculateBudgetTotal = () => {
    return formData.budget.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
      0
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedActivityId) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch(
        `http://localhost:3000/api/activities/${selectedActivityId}/files`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );
      if (res.ok) {
        const newFile = await res.json();
        setAttachments((prev) => [...prev, newFile]);
      } else {
        alert("Failed to upload file");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading file");
    }
    // Clear file input
    e.target.value = "";
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/activities/${selectedActivityId}/files/${fileId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAttachments((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const url = isEditing
        ? `http://localhost:3000/api/activities/${selectedActivityId}`
        : "http://localhost:3000/api/activities";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isEditing ? "update" : "create"} activity`
        );
      }

      const savedActivity = await response.json();

      if (isEditing) {
        setActivities(
          activities.map((a) =>
            a.id === selectedActivityId ? savedActivity : a
          )
        );
        resetForm();
      } else {
        // After creating, switch to edit mode so user can add budget/attachments
        setActivities([...activities, savedActivity]);
        setIsEditing(true);
        setSelectedActivityId(savedActivity.id);
        setFormData((prev) => ({
          ...prev,
          budget: [],
        }));
        setAttachments([]);
        // Show success message
        setFormError(null);
        setFormSuccess(
          "Activity saved! You can now add budget estimates and attachments below."
        );
        // Auto-hide success message after 5 seconds
        setTimeout(() => setFormSuccess(null), 5000);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivityUpdate = async (updatedActivity) => {
    // Optimistic Update
    setActivities((prev) =>
      prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a))
    );

    try {
      const response = await fetch(
        `http://localhost:3000/api/activities/${updatedActivity.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectiveId: updatedActivity.id_objective,
            title: updatedActivity.activity_title,
            description: updatedActivity.activity_description,
            startDate: updatedActivity.startDate,
            endDate: updatedActivity.endDate,
            color: updatedActivity.color,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update activity");
      }
    } catch (err) {
      console.error("Error updating activity:", err);
      // Revert on error could be implemented here by refetching
      alert("Failed to update activity position");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/activities/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete activity");
        }

        setActivities(activities.filter((activity) => activity.id !== id));
      } catch (err) {
        console.error("Error deleting activity:", err);
        alert("Failed to delete activity");
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="activities-container">
      <div className="page-header">
        <h2>Activities</h2>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          Calendar View
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          Activity List
        </button>
        <button
          className={`tab-btn ${activeTab === "tree" ? "active" : ""}`}
          onClick={() => setActiveTab("tree")}
        >
          Objectives Tree
        </button>
      </div>

      {/* Calendar Tab Content */}
      <div style={{ display: activeTab === "calendar" ? "block" : "none" }}>
        {/* Activity Creation Form */}
        <div className="activity-creation-section">
          <div className="form-header">
            <h3>{isEditing ? "Edit Activity" : "Create New Activity"}</h3>
            <button
              className="toggle-form-btn"
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }}
            >
              {showForm ? "▲ Collapse / Cancel" : "▼ Expand / Create New"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="activity-form">
              {formError && <div className="error-message">{formError}</div>}
              {formSuccess && (
                <div className="success-message">{formSuccess}</div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="objectiveId">
                    Link to Strategic Objective
                  </label>
                  <select
                    id="objectiveId"
                    name="objectiveId"
                    value={formData.objectiveId}
                    onChange={handleFormChange}
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
                    onChange={handleFormChange}
                    required
                    placeholder="Enter activity title..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
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
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Label Color</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color || "#3b82f6"}
                      onChange={handleFormChange}
                      style={{ height: "38px", width: "60px", padding: "2px" }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                      {formData.color || "#3b82f6"}
                    </span>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    rows="3"
                    placeholder="Describe the activity..."
                  />
                </div>

                {/* Notice for new activities - Budget and Attachments require save first */}
                {!isEditing && (
                  <div className="form-group full-width">
                    <div className="save-first-notice">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>
                        Save the activity first to add{" "}
                        <strong>Budget Estimates</strong> and{" "}
                        <strong>Attachments</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Budget Section - Only show when editing */}
                {isEditing && (
                  <div className="form-group full-width">
                    <label
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Budget Estimate</span>
                      <span style={{ fontWeight: "bold", color: "#0f172a" }}>
                        Total: $
                        {calculateBudgetTotal().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </label>
                    <div className="budget-table-container">
                      <table className="budget-table">
                        <thead>
                          <tr>
                            <th style={{ width: "18%" }}>Category</th>
                            <th style={{ width: "30%" }}>Description</th>
                            <th style={{ width: "8%" }}>Qty</th>
                            <th style={{ width: "12%" }}>Unit Cost</th>
                            <th style={{ width: "12%" }}>Total</th>
                            <th style={{ width: "10%" }}>Status</th>
                            <th style={{ width: "10%" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.budget.map((item, index) => (
                            <tr
                              key={item.id || `new-${index}`}
                              className={item.isDirty ? "row-dirty" : ""}
                            >
                              <td>
                                <select
                                  value={item.categoryId}
                                  onChange={(e) =>
                                    handleBudgetChange(
                                      index,
                                      "categoryId",
                                      e.target.value
                                    )
                                  }
                                  required
                                  style={{ width: "100%", padding: "4px" }}
                                >
                                  <option value="">Select...</option>
                                  {budgetCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={item.description || ""}
                                  onChange={(e) =>
                                    handleBudgetChange(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Item detail..."
                                  style={{ width: "100%", padding: "4px" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={(e) =>
                                    handleBudgetChange(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  style={{ width: "100%", padding: "4px" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitCost || 0}
                                  onChange={(e) =>
                                    handleBudgetChange(
                                      index,
                                      "unitCost",
                                      e.target.value
                                    )
                                  }
                                  style={{ width: "100%", padding: "4px" }}
                                />
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: "500",
                                }}
                              >
                                $
                                {(
                                  (item.quantity || 0) * (item.unitCost || 0)
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {item.isNew ? (
                                  <span className="badge badge-new">New</span>
                                ) : item.isDirty ? (
                                  <span className="badge badge-modified">
                                    Modified
                                  </span>
                                ) : (
                                  <span className="badge badge-saved">
                                    Saved
                                  </span>
                                )}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "4px",
                                    justifyContent: "center",
                                  }}
                                >
                                  {(item.isNew || item.isDirty) && (
                                    <button
                                      type="button"
                                      className="btn-icon-small btn-save"
                                      onClick={() => saveBudgetLine(index)}
                                      title="Save"
                                    >
                                      💾
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-icon-small btn-delete"
                                    onClick={() => deleteBudgetLine(index)}
                                    title="Delete"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan="7">
                              <button
                                type="button"
                                className="btn-link-small"
                                onClick={addBudgetLine}
                              >
                                + Add Budget Line
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Attachments Section - Only show when editing */}
                {isEditing && (
                  <div className="form-group full-width attachments-section">
                    <div className="attachments-header">
                      <div className="attachments-title">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span>Documents & Attachments</span>
                      </div>
                      <span className="attachments-count">
                        {attachments.length}{" "}
                        {attachments.length === 1 ? "file" : "files"}
                      </span>
                    </div>

                    <div className="attachments-container">
                      {attachments.length > 0 ? (
                        <div className="attachments-grid">
                          {attachments.map((file) => {
                            const ext =
                              file.original_name
                                ?.split(".")
                                .pop()
                                ?.toLowerCase() || "";
                            const isImage = [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                            ].includes(ext);
                            const isPdf = ext === "pdf";
                            const isDoc = ["doc", "docx"].includes(ext);
                            const isExcel = ["xls", "xlsx", "csv"].includes(
                              ext
                            );

                            return (
                              <div key={file.id} className="attachment-card">
                                <div
                                  className={`attachment-icon ${
                                    isPdf
                                      ? "icon-pdf"
                                      : isImage
                                      ? "icon-image"
                                      : isDoc
                                      ? "icon-doc"
                                      : isExcel
                                      ? "icon-excel"
                                      : "icon-file"
                                  }`}
                                >
                                  {isPdf ? (
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                      <path d="M14 2v6h6" />
                                      <text
                                        x="7"
                                        y="17"
                                        fontSize="6"
                                        fill="white"
                                        fontWeight="bold"
                                      >
                                        PDF
                                      </text>
                                    </svg>
                                  ) : isImage ? (
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21,15 16,10 5,21" />
                                    </svg>
                                  ) : isExcel ? (
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                      <path d="M14 2v6h6" />
                                      <text
                                        x="6"
                                        y="17"
                                        fontSize="5"
                                        fill="white"
                                        fontWeight="bold"
                                      >
                                        XLS
                                      </text>
                                    </svg>
                                  ) : (
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14,2 14,8 20,8" />
                                      <line x1="16" y1="13" x2="8" y2="13" />
                                      <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                  )}
                                </div>
                                <div className="attachment-info">
                                  <a
                                    href={`http://localhost:3000/api/activities/${selectedActivityId}/files/${file.id}/download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="attachment-name"
                                    title={file.original_name}
                                  >
                                    {file.original_name}
                                  </a>
                                  <div className="attachment-details">
                                    <span className="attachment-size">
                                      {file.file_size >= 1024 * 1024
                                        ? `${(
                                            file.file_size /
                                            (1024 * 1024)
                                          ).toFixed(1)} MB`
                                        : `${(file.file_size / 1024).toFixed(
                                            1
                                          )} KB`}
                                    </span>
                                    <span className="attachment-ext">
                                      .{ext.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="attachment-actions">
                                  <a
                                    href={`http://localhost:3000/api/activities/${selectedActivityId}/files/${file.id}/download`}
                                    className="btn-attachment-action btn-download"
                                    title="Download"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7,10 12,15 17,10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                  </a>
                                  <button
                                    type="button"
                                    className="btn-attachment-action btn-remove"
                                    onClick={() => handleFileDelete(file.id)}
                                    title="Delete"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polyline points="3,6 5,6 21,6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="no-attachments-placeholder">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                          <p>No documents attached</p>
                          <span>
                            Upload invoices, receipts, or supporting documents
                          </span>
                        </div>
                      )}

                      <div className="upload-dropzone">
                        <input
                          type="file"
                          id="file-upload"
                          onChange={handleFileUpload}
                          style={{ display: "none" }}
                        />
                        <label htmlFor="file-upload" className="dropzone-label">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <div className="dropzone-text">
                            <span className="dropzone-primary">
                              Click to upload
                            </span>
                            <span className="dropzone-secondary">
                              PDF, DOC, XLS, images up to 10MB
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(selectedActivityId)}
                    disabled={formLoading}
                    style={{ marginRight: "auto" }}
                  >
                    Delete Activity
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : isEditing
                    ? "Update Activity"
                    : "Create Activity"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Calendar View */}
      <div
        className="calendar-section"
        style={{ display: activeTab === "calendar" ? "block" : "none" }}
      >
        <div className="calendar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h3>Activity Calendar - {currentYear}</h3>
            <div className="view-toggles">
              <button
                className={`btn-icon-small ${
                  viewMode === "grid" ? "active" : ""
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                className={`btn-icon-small ${
                  viewMode === "vertical" ? "active" : ""
                }`}
                onClick={() => setViewMode("vertical")}
                title="Vertical View"
              >
                ☰
              </button>
            </div>
            <div className="font-controls view-toggles">
              <button
                className={`btn-icon-small ${
                  calendarFontSize === "normal" ? "active" : ""
                }`}
                onClick={() => setCalendarFontSize("normal")}
                title="Normal Text"
              >
                A
              </button>
              <button
                className={`btn-icon-small ${
                  calendarFontSize === "large" ? "active" : ""
                }`}
                onClick={() => setCalendarFontSize("large")}
                title="Large Text"
              >
                A+
              </button>
              <button
                className={`btn-icon-small ${
                  calendarFontSize === "xlarge" ? "active" : ""
                }`}
                onClick={() => setCalendarFontSize("xlarge")}
                title="Extra Large Text"
              >
                A++
              </button>
            </div>
          </div>
          <div className="year-navigation">
            <button
              className="btn-icon-small"
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              ◀ Previous Year
            </button>
            <span className="year-display">{currentYear}</span>
            <button
              className="btn-icon-small"
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              Next Year ▶
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {activities.length === 0 ? (
            <div className="empty-state">
              No activities found. Create one to get started.
            </div>
          ) : (
            <CalendarView
              activities={activities}
              year={currentYear}
              onSelectActivity={handleSelectActivity}
              viewMode={viewMode}
              fontSize={calendarFontSize}
              onContextMenu={(e, activity) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, activity });
              }}
              onActivityUpdate={handleActivityUpdate}
            />
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div
              className="context-menu-item"
              onClick={() => handleSelectActivity(contextMenu.activity)}
            >
              Edit Activity
            </div>
            <div
              className="context-menu-item text-danger"
              onClick={() => handleDelete(contextMenu.activity.id)}
            >
              Delete Activity
            </div>
          </div>
        )}
      </div>

      {/* Activities List Table */}
      {activeTab === "list" && (
        <div className="activities-list-section">
          <h3>All Activities</h3>
          <div className="activities-table-container">
            {activities.length === 0 ? (
              <div className="empty-state">
                No activities found. Create one to get started.
              </div>
            ) : (
              <table className="activities-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date Range</th>
                    <th>Activity</th>
                    <th>Linked Objective</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <span
                          className={`status-badge ${(
                            activity.status || "not-started"
                          )
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {activity.status || "Not Started"}
                        </span>
                      </td>
                      <td className="date-cell">
                        {activity.startDate} <br /> to {activity.endDate}
                      </td>
                      <td>
                        <div className="activity-title-cell">
                          {activity.activity_title}
                        </div>
                      </td>
                      <td>{activity.objective_title}</td>
                      <td>
                        <div className="action-buttons">
                          <div className="tooltip-container">
                            <button className="btn-icon btn-info">ℹ️</button>
                            <div className="tooltip-content">
                              <strong>Description:</strong>
                              <p>{activity.activity_description}</p>
                            </div>
                          </div>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleSelectActivity(activity)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(activity.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Objectives Tree View */}
      {activeTab === "tree" && (
        <div className="objectives-tree-section">
          <h3>Activities by Objective</h3>
          {objectives.map((objective) => {
            const objectiveActivities = activities.filter(
              (a) =>
                a.id_objective === objective.id ||
                a.objectiveId === objective.id
            );
            if (objectiveActivities.length === 0) return null;

            return (
              <div key={objective.id} className="tree-node-objective">
                <div className="objective-header">
                  <span className="folder-icon">📂</span>
                  <strong>{objective.objective_text}</strong>
                  <span className="count-badge">
                    {objectiveActivities.length}
                  </span>
                </div>
                <div className="tree-children">
                  {objectiveActivities.map((activity) => (
                    <div key={activity.id} className="tree-node-activity">
                      <div className="activity-row">
                        <span
                          className="file-icon"
                          style={{ color: activity.color || "#64748b" }}
                        >
                          ●
                        </span>
                        <span className="activity-name">
                          {activity.activity_title}
                        </span>
                        <span className="activity-dates text-muted">
                          (
                          {format(
                            parse(activity.startDate, "yyyy-MM-dd", new Date()),
                            "MMM d"
                          )}{" "}
                          -{" "}
                          {format(
                            parse(activity.endDate, "yyyy-MM-dd", new Date()),
                            "MMM d, yyyy"
                          )}
                          )
                        </span>
                        <button
                          className="btn-link-small"
                          onClick={() => handleSelectActivity(activity)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {activities.filter((a) => !a.id_objective && !a.objectiveId).length >
            0 && (
            <div className="tree-node-objective">
              <div className="objective-header">
                <span className="folder-icon">📂</span>
                <strong>Unlinked Activities</strong>
                <span className="count-badge">
                  {
                    activities.filter((a) => !a.id_objective && !a.objectiveId)
                      .length
                  }
                </span>
              </div>
              <div className="tree-children">
                {activities
                  .filter((a) => !a.id_objective && !a.objectiveId)
                  .map((activity) => (
                    <div key={activity.id} className="tree-node-activity">
                      <div className="activity-row">
                        <span
                          className="file-icon"
                          style={{ color: activity.color || "#64748b" }}
                        >
                          ●
                        </span>
                        <span className="activity-name">
                          {activity.activity_title}
                        </span>
                        <span className="activity-dates text-muted">
                          (
                          {format(
                            parse(activity.startDate, "yyyy-MM-dd", new Date()),
                            "MMM d"
                          )}{" "}
                          -{" "}
                          {format(
                            parse(activity.endDate, "yyyy-MM-dd", new Date()),
                            "MMM d, yyyy"
                          )}
                          )
                        </span>
                        <button
                          className="btn-link-small"
                          onClick={() => handleSelectActivity(activity)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Calendar Grid Component
const CalendarView = ({
  activities,
  year,
  onSelectActivity,
  viewMode,
  fontSize,
  onContextMenu,
  onActivityUpdate,
}) => {
  const handleDragStart = (e, activity, date) => {
    e.dataTransfer.setData("activityId", activity.id);
    e.dataTransfer.setData("originDate", format(date, "yyyy-MM-dd"));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleResizeStart = (e, activity, mode) => {
    e.stopPropagation();
    e.dataTransfer.setData("activityId", activity.id);
    e.dataTransfer.setData("resizeMode", mode);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData("activityId");
    const resizeMode = e.dataTransfer.getData("resizeMode");

    if (!activityId || !targetDate) return;

    const activity = activities.find((a) => a.id.toString() === activityId);
    if (!activity) return;

    const newTargetStr = format(targetDate, "yyyy-MM-dd");

    if (resizeMode) {
      // Handle Resize via Handles
      if (resizeMode === "start") {
        if (newTargetStr > activity.endDate) return; // Prevent start after end
        onActivityUpdate({ ...activity, startDate: newTargetStr });
      } else if (resizeMode === "end") {
        if (newTargetStr < activity.startDate) return; // Prevent end before start
        onActivityUpdate({ ...activity, endDate: newTargetStr });
      }
      return;
    }

    const originDateStr = e.dataTransfer.getData("originDate");
    if (!originDateStr) return;

    if (e.shiftKey) {
      // Legacy Shift+Drag Stretch Mode
      if (newTargetStr < activity.startDate) {
        onActivityUpdate({
          ...activity,
          startDate: newTargetStr,
        });
      } else {
        onActivityUpdate({
          ...activity,
          endDate: newTargetStr,
        });
      }
    } else {
      // Move Mode
      const originDate = parse(originDateStr, "yyyy-MM-dd", new Date());
      const daysDiff = differenceInCalendarDays(targetDate, originDate);

      if (daysDiff !== 0) {
        const oldStart = parse(activity.startDate, "yyyy-MM-dd", new Date());
        const oldEnd = parse(activity.endDate, "yyyy-MM-dd", new Date());

        const newStart = addDays(oldStart, daysDiff);
        const newEnd = addDays(oldEnd, daysDiff);

        onActivityUpdate({
          ...activity,
          startDate: format(newStart, "yyyy-MM-dd"),
          endDate: format(newEnd, "yyyy-MM-dd"),
        });
      }
    }
  };

  const months = [
    "January",

    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const getActivitiesForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return activities.filter((activity) => {
      return dateStr >= activity.startDate && dateStr <= activity.endDate;
    });
  };

  return (
    <div className={`calendar-months-grid ${viewMode} font-${fontSize}`}>
      {months.map((month, monthIndex) => {
        const daysInMonth = getDaysInMonth(monthIndex, year);
        const firstDay = getFirstDayOfMonth(monthIndex, year);
        const days = [];

        // Empty cells before month starts
        for (let i = 0; i < firstDay; i++) {
          days.push(null);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
          days.push(new Date(year, monthIndex, day));
        }

        return (
          <div key={month} className="calendar-month">
            <h4>{month}</h4>
            <div className="month-weekdays">
              <div className="weekday">Sun</div>
              <div className="weekday">Mon</div>
              <div className="weekday">Tue</div>
              <div className="weekday">Wed</div>
              <div className="weekday">Thu</div>
              <div className="weekday">Fri</div>
              <div className="weekday">Sat</div>
            </div>
            <div className="month-days">
              {days.map((date, index) => {
                const dayActivities = date ? getActivitiesForDate(date) : [];
                const dateStr = date ? format(date, "yyyy-MM-dd") : null;
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const isToday = dateStr === todayStr;
                // Only consider past if it's strictly before today
                const isPast = dateStr && dateStr < todayStr;

                return (
                  <div
                    key={index}
                    className={`day-cell ${!date ? "empty" : ""} ${
                      dayActivities.length > 0 ? "has-activity" : ""
                    } ${isToday ? "is-today" : ""} ${isPast ? "is-past" : ""}`}
                    onDragOver={(e) => {
                      if (date) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(e) => date && handleDrop(e, date)}
                  >
                    {date && (
                      <>
                        <span className="day-number">{date.getDate()}</span>
                        <div className="day-activities">
                          {dayActivities
                            .slice(0, viewMode === "vertical" ? 10 : 2)
                            .map((activity) => {
                              const isStart = dateStr === activity.startDate;
                              const isEnd = dateStr === activity.endDate;

                              return (
                                <div
                                  key={activity.id}
                                  className={`activity-badge ${
                                    isStart ? "is-start" : ""
                                  } ${isEnd ? "is-end" : ""}`}
                                  draggable="true"
                                  onDragStart={(e) =>
                                    handleDragStart(e, activity, date)
                                  }
                                  title={activity.activity_title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectActivity(activity);
                                  }}
                                  onContextMenu={(e) => {
                                    e.stopPropagation();
                                    if (onContextMenu)
                                      onContextMenu(e, activity);
                                  }}
                                  style={{
                                    backgroundColor:
                                      activity.color || "#dbeafe",
                                    color: activity.color ? "#fff" : "#1e40af",
                                    textShadow: activity.color
                                      ? "0 1px 2px rgba(0,0,0,0.3)"
                                      : "none",
                                  }}
                                >
                                  {isStart && (
                                    <span
                                      className="resize-handle start"
                                      draggable="true"
                                      onDragStart={(e) =>
                                        handleResizeStart(e, activity, "start")
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  {viewMode === "vertical"
                                    ? activity.activity_title
                                    : activity.activity_title.substring(0, 8)}
                                  {isEnd && (
                                    <span
                                      className="resize-handle end"
                                      draggable="true"
                                      onDragStart={(e) =>
                                        handleResizeStart(e, activity, "end")
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          {dayActivities.length >
                            (viewMode === "vertical" ? 10 : 2) && (
                            <div className="activity-badge more">
                              +
                              {dayActivities.length -
                                (viewMode === "vertical" ? 10 : 2)}{" "}
                              more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Activities;
