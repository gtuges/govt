const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all role types
router.get("/", (req, res) => {
  const query = `
    SELECT rt.*,
      (SELECT COUNT(*) FROM department_roles WHERE id_role_type = rt.id_role_type AND is_active = 1) as usage_count
    FROM role_types rt
    WHERE rt.is_active = 1
    ORDER BY rt.role_type_name ASC
  `;
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching role types:", err);
      res.status(500).json({ error: "Failed to fetch role types" });
      return;
    }
    res.json(results);
  });
});

// Get single role type
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM role_types 
    WHERE id_role_type = ? AND is_active = 1
  `;
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching role type:", err);
      res.status(500).json({ error: "Failed to fetch role type" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "Role type not found" });
      return;
    }
    res.json(results[0]);
  });
});

// Create role type
router.post("/", (req, res) => {
  const { role_type_code, role_type_name } = req.body;

  if (!role_type_code || !role_type_name) {
    return res
      .status(400)
      .json({ error: "Role type code and name are required" });
  }

  const query =
    "INSERT INTO role_types (role_type_code, role_type_name) VALUES (?, ?)";
  pool.query(query, [role_type_code, role_type_name], (err, result) => {
    if (err) {
      console.error("Error creating role type:", err);
      res.status(500).json({ error: "Failed to create role type" });
      return;
    }
    res.status(201).json({ id_role_type: result.insertId, ...req.body });
  });
});

// Update role type
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { role_type_code, role_type_name } = req.body;

  if (!role_type_code || !role_type_name) {
    return res
      .status(400)
      .json({ error: "Role type code and name are required" });
  }

  const query =
    "UPDATE role_types SET role_type_code = ?, role_type_name = ? WHERE id_role_type = ?";
  pool.query(query, [role_type_code, role_type_name, id], (err, result) => {
    if (err) {
      console.error("Error updating role type:", err);
      res.status(500).json({ error: "Failed to update role type" });
      return;
    }
    res.json({ message: "Role type updated successfully" });
  });
});

// Delete role type (soft delete)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = "UPDATE role_types SET is_active = 0 WHERE id_role_type = ?";
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting role type:", err);
      res.status(500).json({ error: "Failed to delete role type" });
      return;
    }
    res.json({ message: "Role type deleted successfully" });
  });
});

module.exports = router;
