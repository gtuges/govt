const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const createUploadMiddleware = require("../middleware/upload");
require("dotenv").config();

const upload = createUploadMiddleware("avatars");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get all users
router.get("/", (req, res) => {
  const query = `
    SELECT 
      u.id_user as id,
      u.first_name,
      u.last_name,
      u.email,
      u.is_active,
      u.profile_image_path,
      d.department_name,
      u.id_department
    FROM users u
    LEFT JOIN departments d ON u.id_department = d.id_department
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at DESC
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
      return;
    }
    res.json(results);
  });
});

// Get single user
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      id_user as id,
      first_name,
      last_name,
      email,
      id_department,
      is_active,
      profile_image_path
    FROM users
    WHERE id_user = ? AND deleted_at IS NULL
  `;

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Failed to fetch user" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(results[0]);
  });
});

// Create user
router.post("/", upload.single("image"), async (req, res) => {
  const { firstName, lastName, email, password, departmentId } = req.body;
  const orgId = 1; // Hardcoded Org ID
  // Store relative path for database
  const profileImagePath = req.file
    ? `uploads/avatars/${req.file.filename}`
    : null;

  const promisePool = pool.promise();

  try {
    const [result] = await promisePool.query(
      `INSERT INTO users 
       (id_org, first_name, last_name, email, password_hash, id_department, is_active, profile_image_path) 
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        orgId,
        firstName,
        lastName,
        email,
        password || "default123",
        departmentId || null,
        profileImagePath,
      ]
    );

    res
      .status(201)
      .json({ id: result.insertId, message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res
      .status(500)
      .json({ error: "Failed to create user", details: err.message });
  }
});

// Update user
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, departmentId, isActive, password } =
    req.body;
  // Store relative path for database
  const profileImagePath = req.file
    ? `uploads/avatars/${req.file.filename}`
    : null;

  const promisePool = pool.promise();

  try {
    let query = `UPDATE users SET first_name = ?, last_name = ?, email = ?, id_department = ?, is_active = ?`;
    let params = [
      firstName,
      lastName,
      email,
      departmentId || null,
      isActive === "true" || isActive === true ? 1 : 0,
    ];

    if (password && password.trim() !== "") {
      query += `, password_hash = ?`;
      params.push(password);
    }

    if (profileImagePath) {
      query += `, profile_image_path = ?`;
      params.push(profileImagePath);
    }

    query += ` WHERE id_user = ?`;
    params.push(id);

    await promisePool.query(query, params);

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (Soft delete)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const promisePool = pool.promise();

  try {
    await promisePool.query(
      "UPDATE users SET deleted_at = NOW() WHERE id_user = ?",
      [id]
    );
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
