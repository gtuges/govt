import React, { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { Edit, Trash2, Plus, X } from "lucide-react";
import "./Branches.css";

const Branches = () => {
  const { addNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: "",
    branch_code: "",
    id_department: "",
    id_parent_branch: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      addNotification("Failed to load branches", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentBranch
      ? `http://localhost:3000/api/branches/${currentBranch.id_branch}`
      : "http://localhost:3000/api/branches";
    const method = currentBranch ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Operation failed");

      addNotification(
        `Branch ${currentBranch ? "updated" : "created"} successfully`,
        "success"
      );
      fetchBranches();
      closeModal();
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleDelete = (id) => {
    confirm(
      "Are you sure you want to delete this branch?",
      async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/branches/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete");
          setBranches(branches.filter((b) => b.id_branch !== id));
          addNotification("Branch deleted successfully", "success");
        } catch (err) {
          addNotification("Failed to delete branch", "error");
        }
      },
      "Delete Branch"
    );
  };

  const openModal = (branch = null) => {
    if (branch) {
      setCurrentBranch(branch);
      setFormData({
        branch_name: branch.branch_name,
        branch_code: branch.branch_code || "",
        id_department: branch.id_department,
        id_parent_branch: branch.id_parent_branch || "",
      });
    } else {
      setCurrentBranch(null);
      setFormData({
        branch_name: "",
        branch_code: "",
        id_department: "",
        id_parent_branch: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBranch(null);
  };

  const filteredBranches = branches.filter((b) =>
    b.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if a branch has children (other branches reporting to it)
  const hasChildren = (branchId) => {
    return branches.some((b) => b.id_parent_branch === branchId);
  };

  return (
    <div className="branches-container">
      <div className="page-header">
        <h2>Branches</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Branch
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Code</th>
              <th>Department</th>
              <th>Reports To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((branch) => (
              <tr key={branch.id_branch}>
                <td>{branch.branch_name}</td>
                <td>{branch.branch_code}</td>
                <td>{branch.department_name}</td>
                <td>{branch.parent_branch_name || "-"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-icon"
                      onClick={() => openModal(branch)}
                      title="Edit Branch"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(branch.id_branch)}
                      disabled={hasChildren(branch.id_branch)}
                      title={
                        hasChildren(branch.id_branch)
                          ? "Cannot delete - branch has sub-branches"
                          : "Delete Branch"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentBranch ? "Edit Branch" : "Add Branch"}</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.id_department}
                  onChange={(e) =>
                    setFormData({ ...formData, id_department: e.target.value })
                  }
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id_department} value={dept.id_department}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Branch Code</label>
                <input
                  type="text"
                  value={formData.branch_code}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_code: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Reports To (Optional)</label>
                <select
                  value={formData.id_parent_branch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_parent_branch: e.target.value,
                    })
                  }
                >
                  <option value="">None (Top Level)</option>
                  {branches
                    .filter((b) => b.id_branch !== currentBranch?.id_branch) // Prevent self-selection
                    .map((b) => (
                      <option key={b.id_branch} value={b.id_branch}>
                        {b.branch_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
