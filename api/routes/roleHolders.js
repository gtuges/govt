const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all role holders
router.get("/", (req, res) => {
  const query = `
    SELECT 
      drh.*,
      dr.role_title,
      rt.role_type_name,
      d.department_name,
      b.branch_name,
      u.first_name,
      u.last_name,
      u.email
    FROM department_role_holders drh
    JOIN department_roles dr ON drh.id_department_role = dr.id_department_role
    JOIN role_types rt ON dr.id_role_type = rt.id_role_type
    JOIN departments d ON dr.id_department = d.id_department
    LEFT JOIN branches b ON dr.id_branch = b.id_branch
    JOIN users u ON drh.id_user = u.id_user
    WHERE drh.end_date = '9999-12-31'
    ORDER BY d.department_name, b.branch_name, dr.role_title
  `;
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching role holders:", err);
      res.status(500).json({ error: "Failed to fetch role holders" });
      return;
    }
    res.json(results);
  });
});

// Assign user to role
router.post("/", (req, res) => {
  const { id_department_role, id_user, start_date } = req.body;

  console.log("Received role assignment request:", req.body);

  if (!id_department_role || !id_user || !start_date) {
    return res
      .status(400)
      .json({ error: "Department role, user, and start date are required" });
  }

  // Validate that id_user is a number
  const userIdNum = parseInt(id_user, 10);
  if (isNaN(userIdNum)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  // Calculate the end date for existing assignment (one day before start_date)
  const previousEndDate = new Date(start_date);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const endDateStr = previousEndDate.toISOString().split("T")[0];

  // First, end any existing assignment for this role
  const endExistingQuery = `
    UPDATE department_role_holders 
    SET end_date = ? 
    WHERE id_department_role = ? AND end_date = '9999-12-31'
  `;

  pool.query(endExistingQuery, [endDateStr, id_department_role], (err) => {
    if (err) {
      console.error("Error ending existing assignment:", err);
      res.status(500).json({ error: "Failed to end existing assignment" });
      return;
    }

    // Now create the new assignment
    const insertQuery = `
      INSERT INTO department_role_holders 
      (id_department_role, id_user, start_date, end_date) 
      VALUES (?, ?, ?, '9999-12-31')
    `;

    pool.query(
      insertQuery,
      [id_department_role, userIdNum, start_date],
      (err, result) => {
        if (err) {
          console.error("Error assigning user to role:", err);
          res.status(500).json({ error: "Failed to assign user to role" });
          return;
        }
        res.status(201).json({
          id_department_role_holder: result.insertId,
          ...req.body,
        });
      }
    );
  });
});

// Remove user from role (set end date)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { end_date } = req.body;

  if (!end_date) {
    return res.status(400).json({ error: "End date is required" });
  }

  const query = `
    UPDATE department_role_holders 
    SET end_date = ? 
    WHERE id_department_role_holder = ?
  `;

  pool.query(query, [end_date, id], (err, result) => {
    if (err) {
      console.error("Error removing user from role:", err);
      res.status(500).json({ error: "Failed to remove user from role" });
      return;
    }
    res.json({ message: "User removed from role successfully" });
  });
});

module.exports = router;
