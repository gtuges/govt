import React, { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { UserPlus, X } from "lucide-react";
import "./UserRoles.css";

const UserRoles = () => {
  const { addNotification } = useNotification();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [roleHolders, setRoleHolders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    id_user: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchRoleHolders();
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const activeUsers = data.filter((u) => u.is_active === 1);
      console.log("Active users loaded:", activeUsers);
      setUsers(activeUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoleHolders = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/role-holders");
      if (!res.ok) throw new Error("Failed to fetch role holders");
      const data = await res.json();
      setRoleHolders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== SUBMIT DEBUG ===");
    console.log("Full formData:", formData);
    console.log("id_user value:", formData.id_user);
    console.log("id_user type:", typeof formData.id_user);
    console.log("Available users:", users);

    if (!formData.id_user || formData.id_user === "") {
      addNotification("Please select a user", "error");
      return;
    }

    const userId = parseInt(formData.id_user, 10);
    console.log("Parsed userId:", userId);
    console.log("Is NaN?:", isNaN(userId));

    if (isNaN(userId)) {
      addNotification("Invalid user selection", "error");
      return;
    }

    try {
      const payload = {
        id_department_role: selectedRole.id_department_role,
        id_user: userId,
        start_date: formData.start_date,
      };
      console.log("Sending payload:", payload);

      const res = await fetch("http://localhost:3000/api/role-holders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      addNotification("User assigned to position successfully", "success");
      fetchRoleHolders();
      closeModal();
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const openModal = (role) => {
    setSelectedRole(role);
    setFormData({
      id_user: "",
      start_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  // Get current holder for a role
  const getCurrentHolder = (roleId) => {
    return roleHolders.find((rh) => rh.id_department_role === roleId);
  };

  const filteredRoles = roles.filter(
    (r) =>
      (r.role_title || r.role_type_name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      r.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.branch_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-roles-container">
      <div className="page-header">
        <h2>User Role Assignments</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Role Type</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Current Holder</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => {
              const holder = getCurrentHolder(role.id_department_role);
              return (
                <tr key={role.id_department_role}>
                  <td>{role.role_title || role.role_type_name}</td>
                  <td>{role.role_type_name}</td>
                  <td>{role.department_name}</td>
                  <td>{role.branch_name || "-"}</td>
                  <td>
                    {holder ? (
                      <span className="holder-info">
                        {holder.first_name} {holder.last_name}
                        <small>{holder.email}</small>
                      </span>
                    ) : (
                      <span className="no-holder">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-assign"
                      onClick={() => openModal(role)}
                      title="Assign Person"
                    >
                      <UserPlus size={16} />
                      {holder ? "Reassign" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedRole && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign User to Position</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="role-details">
              <p>
                <strong>Position:</strong>{" "}
                {selectedRole.role_title || selectedRole.role_type_name}
              </p>
              <p>
                <strong>Department:</strong> {selectedRole.department_name}
              </p>
              {selectedRole.branch_name && (
                <p>
                  <strong>Branch:</strong> {selectedRole.branch_name}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select User *</label>
                <select
                  value={formData.id_user}
                  onChange={(e) => {
                    console.log("Selected user ID:", e.target.value);
                    console.log(
                      "Selected option element:",
                      e.target.selectedOptions[0]
                    );
                    setFormData({ ...formData, id_user: e.target.value });
                  }}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.length === 0 && (
                    <option disabled>No active users found</option>
                  )}
                  {users.map((user) => {
                    console.log("Rendering user option:", user);
                    return (
                      <option key={user.id} value={String(user.id)}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    );
                  })}
                </select>
                {users.length === 0 && (
                  <small style={{ color: "red" }}>
                    No active users available
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
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
                  Assign User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
