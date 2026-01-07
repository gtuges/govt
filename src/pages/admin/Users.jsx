import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import "./Users.css";

const Users = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch("http://localhost:3000/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDelete = (id) => {
    confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/api/users/${id}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to delete user");
          }

          setUsers(users.filter((user) => user.id !== id));
          addNotification("User deleted successfully", "success");
        } catch (err) {
          console.error("Error deleting user:", err);
          addNotification("Failed to delete user", "error");
        }
      },
      "Delete User"
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="users-container">
      <div className="page-header users-header">
        <h2>User Profiles</h2>
        <div style={{ display: "flex", gap: "16px" }}>
          <input
            type="text"
            placeholder="Search users..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => navigate("/admin/create-user")}
          >
            Add New User
          </button>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "24px" }}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info-cell">
                      <img
                        src={
                          user.profile_image_path
                            ? `http://localhost:3000/${user.profile_image_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${user.first_name} ${user.last_name}`
                              )}&background=random&rounded=true`
                        }
                        alt={`${user.first_name} ${user.last_name}`}
                        className="user-avatar"
                      />
                      <div className="user-details">
                        <span className="user-name">{`${user.first_name} ${user.last_name}`}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.department_name || "Unassigned"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.is_active ? "active" : "inactive"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/admin/edit-user/${user.id}`)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(user.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
