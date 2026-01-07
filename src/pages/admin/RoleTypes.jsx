import React, { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { Edit, Trash2, Plus, X } from "lucide-react";
import "./RoleTypes.css";

const RoleTypes = () => {
  const { addNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [roleTypes, setRoleTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoleType, setCurrentRoleType] = useState(null);
  const [formData, setFormData] = useState({
    role_type_code: "",
    role_type_name: "",
  });

  useEffect(() => {
    fetchRoleTypes();
  }, []);

  const fetchRoleTypes = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/role-types");
      if (!res.ok) throw new Error("Failed to fetch role types");
      const data = await res.json();
      setRoleTypes(data);
    } catch (err) {
      addNotification("Failed to load role types", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentRoleType
      ? `http://localhost:3000/api/role-types/${currentRoleType.id_role_type}`
      : "http://localhost:3000/api/role-types";
    const method = currentRoleType ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Operation failed");

      addNotification(
        `Role type ${currentRoleType ? "updated" : "created"} successfully`,
        "success"
      );
      fetchRoleTypes();
      closeModal();
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleDelete = (id) => {
    confirm(
      "Are you sure you want to delete this role type?",
      async () => {
        try {
          const res = await fetch(
            `http://localhost:3000/api/role-types/${id}`,
            {
              method: "DELETE",
            }
          );
          if (!res.ok) throw new Error("Failed to delete");
          setRoleTypes(roleTypes.filter((rt) => rt.id_role_type !== id));
          addNotification("Role type deleted successfully", "success");
        } catch (err) {
          addNotification("Failed to delete role type", "error");
        }
      },
      "Delete Role Type"
    );
  };

  const openModal = (roleType = null) => {
    if (roleType) {
      setCurrentRoleType(roleType);
      setFormData({
        role_type_code: roleType.role_type_code,
        role_type_name: roleType.role_type_name,
      });
    } else {
      setCurrentRoleType(null);
      setFormData({
        role_type_code: "",
        role_type_name: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRoleType(null);
  };

  const filteredRoleTypes = roleTypes.filter(
    (rt) =>
      rt.role_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rt.role_type_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="role-types-container">
      <div className="page-header">
        <h2>Role Types</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search role types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Role Type
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Usage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoleTypes.map((roleType) => (
              <tr key={roleType.id_role_type}>
                <td>{roleType.role_type_code}</td>
                <td>{roleType.role_type_name}</td>
                <td>{roleType.usage_count} position(s)</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-icon"
                      onClick={() => openModal(roleType)}
                      title="Edit Role Type"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(roleType.id_role_type)}
                      disabled={roleType.usage_count > 0}
                      title={
                        roleType.usage_count > 0
                          ? "Cannot delete - role type is in use"
                          : "Delete Role Type"
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
              <h3>{currentRoleType ? "Edit Role Type" : "Add Role Type"}</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Type Code *</label>
                <input
                  type="text"
                  value={formData.role_type_code}
                  onChange={(e) =>
                    setFormData({ ...formData, role_type_code: e.target.value })
                  }
                  placeholder="e.g., MANAGER"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role Type Name *</label>
                <input
                  type="text"
                  value={formData.role_type_name}
                  onChange={(e) =>
                    setFormData({ ...formData, role_type_name: e.target.value })
                  }
                  placeholder="e.g., Department Manager"
                  required
                />
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

export default RoleTypes;
