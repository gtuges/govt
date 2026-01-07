const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all branches
router.get("/", (req, res) => {
  const query = `
    SELECT b.*, d.department_name, pb.branch_name as parent_branch_name
    FROM branches b
    JOIN departments d ON b.id_department = d.id_department
    LEFT JOIN branches pb ON b.id_parent_branch = pb.id_branch
    WHERE b.deleted_at IS NULL
    ORDER BY b.branch_name ASC
  `;
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching branches:", err);
      res.status(500).json({ error: "Failed to fetch branches" });
      return;
    }
    res.json(results);
  });
});

// Get single branch
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM branches 
    WHERE id_branch = ? AND deleted_at IS NULL
  `;
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching branch:", err);
      res.status(500).json({ error: "Failed to fetch branch" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "Branch not found" });
      return;
    }
    res.json(results[0]);
  });
});

// Create branch
router.post("/", (req, res) => {
  const { id_department, branch_name, branch_code, id_parent_branch } =
    req.body;

  if (!id_department || !branch_name) {
    return res
      .status(400)
      .json({ error: "Department and Branch Name are required" });
  }

  const query =
    "INSERT INTO branches (id_department, branch_name, branch_code, id_parent_branch) VALUES (?, ?, ?, ?)";
  pool.query(
    query,
    [id_department, branch_name, branch_code, id_parent_branch || null],
    (err, result) => {
      if (err) {
        console.error("Error creating branch:", err);
        res.status(500).json({ error: "Failed to create branch" });
        return;
      }
      res.status(201).json({ id_branch: result.insertId, ...req.body });
    }
  );
});

// Update branch
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { id_department, branch_name, branch_code, id_parent_branch } =
    req.body;

  if (!id_department || !branch_name) {
    return res
      .status(400)
      .json({ error: "Department and Branch Name are required" });
  }

  const query =
    "UPDATE branches SET id_department = ?, branch_name = ?, branch_code = ?, id_parent_branch = ?, updated_at = NOW() WHERE id_branch = ?";
  pool.query(
    query,
    [id_department, branch_name, branch_code, id_parent_branch || null, id],
    (err, result) => {
      if (err) {
        console.error("Error updating branch:", err);
        res.status(500).json({ error: "Failed to update branch" });
        return;
      }
      res.json({ message: "Branch updated successfully" });
    }
  );
});

// Delete branch (soft delete)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = "UPDATE branches SET deleted_at = NOW() WHERE id_branch = ?";
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting branch:", err);
      res.status(500).json({ error: "Failed to delete branch" });
      return;
    }
    res.json({ message: "Branch deleted successfully" });
  });
});

module.exports = router;
