import React, { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { Edit, Trash2, Plus, X } from "lucide-react";
import "./Positions.css";

const Positions = () => {
  const { addNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roleTypes, setRoleTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [formData, setFormData] = useState({
    id_org: 1, // Default org
    id_department: "",
    id_branch: "",
    id_role_type: "",
    role_title: "",
    parent_role_id: "",
  });

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
    fetchBranches();
    fetchRoleTypes();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/department-roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      addNotification("Failed to load roles", "error");
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

  const fetchBranches = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoleTypes = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/role-types");
      if (!res.ok) throw new Error("Failed to fetch role types");
      const data = await res.json();
      setRoleTypes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentRole
      ? `http://localhost:3000/api/department-roles/${currentRole.id_department_role}`
      : "http://localhost:3000/api/department-roles";
    const method = currentRole ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Operation failed");

      addNotification(
        `Position ${currentRole ? "updated" : "created"} successfully`,
        "success"
      );
      fetchRoles();
      closeModal();
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleDelete = (id) => {
    confirm(
      "Are you sure you want to delete this position?",
      async () => {
        try {
          const res = await fetch(
            `http://localhost:3000/api/department-roles/${id}`,
            {
              method: "DELETE",
            }
          );
          if (!res.ok) throw new Error("Failed to delete");
          setRoles(roles.filter((r) => r.id_department_role !== id));
          addNotification("Position deleted successfully", "success");
        } catch (err) {
          addNotification("Failed to delete position", "error");
        }
      },
      "Delete Position"
    );
  };

  const openModal = (role = null) => {
    if (role) {
      setCurrentRole(role);
      setFormData({
        id_org: role.id_org,
        id_department: role.id_department,
        id_branch: role.id_branch || "",
        id_role_type: role.id_role_type,
        role_title: role.role_title || "",
        parent_role_id: role.parent_role_id || "",
      });
    } else {
      setCurrentRole(null);
      setFormData({
        id_org: 1,
        id_department: "",
        id_branch: "",
        id_role_type: "",
        role_title: "",
        parent_role_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRole(null);
  };

  const filteredRoles = roles.filter((r) =>
    (r.role_title || r.role_type_name)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Check if a role has children (other roles reporting to it)
  const hasChildren = (roleId) => {
    return roles.some((r) => r.parent_role_id === roleId);
  };

  // Get branches filtered by selected department
  const getFilteredBranches = () => {
    if (!formData.id_department) return [];
    return branches.filter(
      (b) => b.id_department === parseInt(formData.id_department)
    );
  };

  return (
    <div className="positions-container">
      <div className="page-header">
        <h2>Departmental Positions</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Position
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Position Title</th>
              <th>Role Type</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Reports To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => (
              <tr key={role.id_department_role}>
                <td>{role.role_title || role.role_type_name}</td>
                <td>{role.role_type_name}</td>
                <td>{role.department_name}</td>
                <td>{role.branch_name || "-"}</td>
                <td>{role.parent_role_title || "-"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-icon"
                      onClick={() => openModal(role)}
                      title="Edit Position"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(role.id_department_role)}
                      disabled={hasChildren(role.id_department_role)}
                      title={
                        hasChildren(role.id_department_role)
                          ? "Cannot delete - position has subordinates"
                          : "Delete Position"
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
              <h3>{currentRole ? "Edit Position" : "Add Position"}</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.id_department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_department: e.target.value,
                      id_branch: "",
                    })
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
                <label>Branch (Optional)</label>
                <select
                  value={formData.id_branch}
                  onChange={(e) =>
                    setFormData({ ...formData, id_branch: e.target.value })
                  }
                  disabled={!formData.id_department}
                >
                  <option value="">No specific branch</option>
                  {getFilteredBranches().map((branch) => (
                    <option key={branch.id_branch} value={branch.id_branch}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role Type *</label>
                <select
                  value={formData.id_role_type}
                  onChange={(e) =>
                    setFormData({ ...formData, id_role_type: e.target.value })
                  }
                  required
                >
                  <option value="">Select Role Type</option>
                  {roleTypes.map((rt) => (
                    <option key={rt.id_role_type} value={rt.id_role_type}>
                      {rt.role_type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position Title (Optional)</label>
                <input
                  type="text"
                  value={formData.role_title}
                  onChange={(e) =>
                    setFormData({ ...formData, role_title: e.target.value })
                  }
                  placeholder="e.g., Secretary of Health"
                />
              </div>

              <div className="form-group">
                <label>Reports To (Optional)</label>
                <select
                  value={formData.parent_role_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_role_id: e.target.value })
                  }
                >
                  <option value="">None (Top Level)</option>
                  {roles
                    .filter(
                      (r) =>
                        r.id_department_role !== currentRole?.id_department_role
                    )
                    .map((r) => (
                      <option
                        key={r.id_department_role}
                        value={r.id_department_role}
                      >
                        {r.role_title || r.role_type_name} - {r.department_name}
                        {r.branch_name ? ` (${r.branch_name})` : ""}
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

export default Positions;
