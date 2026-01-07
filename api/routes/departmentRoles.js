const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all department roles
router.get("/", (req, res) => {
  const query = `
    SELECT 
      dr.*,
      d.department_name,
      b.branch_name,
      rt.role_type_name,
      pr.role_title as parent_role_title
    FROM department_roles dr
    JOIN departments d ON dr.id_department = d.id_department
    LEFT JOIN branches b ON dr.id_branch = b.id_branch
    JOIN role_types rt ON dr.id_role_type = rt.id_role_type
    LEFT JOIN department_roles pr ON dr.parent_role_id = pr.id_department_role
    WHERE dr.is_active = 1
    ORDER BY d.department_name, b.branch_name, dr.role_title
  `;
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching department roles:", err);
      res.status(500).json({ error: "Failed to fetch department roles" });
      return;
    }
    res.json(results);
  });
});

// Get single department role
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM department_roles 
    WHERE id_department_role = ? AND is_active = 1
  `;
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching department role:", err);
      res.status(500).json({ error: "Failed to fetch department role" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "Department role not found" });
      return;
    }
    res.json(results[0]);
  });
});

// Create department role
router.post("/", (req, res) => {
  const {
    id_org,
    id_department,
    id_branch,
    id_role_type,
    role_title,
    parent_role_id,
  } = req.body;

  if (!id_org || !id_department || !id_role_type) {
    return res
      .status(400)
      .json({ error: "Organization, Department, and Role Type are required" });
  }

  const query = `
    INSERT INTO department_roles 
    (id_org, id_department, id_branch, id_role_type, role_title, parent_role_id) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    query,
    [
      id_org,
      id_department,
      id_branch || null,
      id_role_type,
      role_title,
      parent_role_id || null,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating department role:", err);
        res.status(500).json({ error: "Failed to create department role" });
        return;
      }
      res
        .status(201)
        .json({ id_department_role: result.insertId, ...req.body });
    }
  );
});

// Update department role
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { id_department, id_branch, id_role_type, role_title, parent_role_id } =
    req.body;

  if (!id_department || !id_role_type) {
    return res
      .status(400)
      .json({ error: "Department and Role Type are required" });
  }

  const query = `
    UPDATE department_roles 
    SET id_department = ?, id_branch = ?, id_role_type = ?, role_title = ?, parent_role_id = ?
    WHERE id_department_role = ?
  `;

  pool.query(
    query,
    [
      id_department,
      id_branch || null,
      id_role_type,
      role_title,
      parent_role_id || null,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating department role:", err);
        res.status(500).json({ error: "Failed to update department role" });
        return;
      }
      res.json({ message: "Department role updated successfully" });
    }
  );
});

// Delete department role (soft delete)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query =
    "UPDATE department_roles SET is_active = 0 WHERE id_department_role = ?";
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting department role:", err);
      res.status(500).json({ error: "Failed to delete department role" });
      return;
    }
    res.json({ message: "Department role deleted successfully" });
  });
});

module.exports = router;
