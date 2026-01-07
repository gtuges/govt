import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
import "../CreateMission.css"; // Reusing form styles

const EditUser = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { id } = useParams();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    departmentId: "",
    isActive: true,
    password: "",
    image: null,
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch departments
    fetch("http://localhost:3000/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((err) => console.error("Error fetching departments:", err));

    // Fetch user details
    fetch(`http://localhost:3000/api/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user details");
        return res.json();
      })
      .then((data) => {
        setFormData({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          departmentId: data.id_department || "",
          isActive: data.is_active === 1,
          password: "",
          image: null,
        });
        setCurrentImage(data.profile_image_path);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setError(err.message);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("email", formData.email);
    data.append("departmentId", formData.departmentId);
    data.append("isActive", formData.isActive);
    if (formData.password) {
      data.append("password", formData.password);
    }
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "PUT",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      addNotification("User updated successfully", "success");
      navigate("/admin/users");
    } catch (err) {
      setError(err.message);
      addNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-mission-container">
      <div className="page-header">
        <h2>Edit User Profile</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-mission-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="image">Profile Image</label>
          {currentImage && (
            <div style={{ marginBottom: "10px" }}>
              <img
                src={`http://localhost:3000/${currentImage}`}
                alt="Current Profile"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">New Password (Optional)</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="departmentId">Department</label>
          <select
            id="departmentId"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
          >
            <option value="">Select Department (Optional)</option>
            {departments.map((dept) => (
              <option key={dept.id_department} value={dept.id_department}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label
            htmlFor="isActive"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Active User
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
