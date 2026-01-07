const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();

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

// Get all objectives with budget totals (estimated and actual)
router.get("/", (req, res) => {
  const { year } = req.query;

  let yearFilter = "";
  const params = [];

  if (year) {
    yearFilter = "AND YEAR(pp.start_date) = ?";
    params.push(year);
  }

  const query = `
    SELECT 
      o.id_objective as id,
      o.objective_title as objective_text,
      o.objective_narrative as narrative,
      d.department_name,
      dp.mission,
      sv.status_name as status,
      YEAR(pp.start_date) as fiscal_year,
      COALESCE(budget.estimated_budget, 0) as estimated_budget,
      COALESCE(budget.actual_expenditure, 0) as actual_expenditure,
      COALESCE(budget.activity_count, 0) as activity_count
    FROM objectives o
    JOIN department_plans dp ON o.id_department_plan = dp.id_department_plan
    JOIN plan_periods pp ON dp.id_plan_period = pp.id_plan_period
    JOIN departments d ON dp.id_department = d.id_department
    JOIN status_values sv ON o.id_status_value = sv.id_status_value
    LEFT JOIN (
      SELECT 
        a.id_objective,
        SUM(bl.qty * bl.unit_cost) as estimated_budget,
        SUM(COALESCE(exp.total_expenses, 0)) as actual_expenditure,
        COUNT(DISTINCT a.id_activity) as activity_count
      FROM activities a
      LEFT JOIN budget_lines bl ON a.id_activity = bl.id_activity AND bl.deleted_at IS NULL
      LEFT JOIN (
        SELECT id_budget_line, SUM(amount) as total_expenses
        FROM expenses
        WHERE deleted_at IS NULL
        GROUP BY id_budget_line
      ) exp ON bl.id_budget_line = exp.id_budget_line
      WHERE a.deleted_at IS NULL
      GROUP BY a.id_objective
    ) budget ON o.id_objective = budget.id_objective
    WHERE o.deleted_at IS NULL ${yearFilter}
    ORDER BY pp.start_date DESC, o.created_at DESC
  `;

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching objectives:", err);
      res.status(500).json({ error: "Failed to fetch objectives" });
      return;
    }
    res.json(results);
  });
});

// Get available fiscal years
router.get("/years/available", (req, res) => {
  const query = `
    SELECT DISTINCT YEAR(pp.start_date) as year
    FROM objectives o
    JOIN department_plans dp ON o.id_department_plan = dp.id_department_plan
    JOIN plan_periods pp ON dp.id_plan_period = pp.id_plan_period
    WHERE o.deleted_at IS NULL
    ORDER BY year DESC
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching years:", err);
      res.status(500).json({ error: "Failed to fetch years" });
      return;
    }
    res.json(results.map((r) => r.year));
  });
});

// Get single objective
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      o.id_objective as id,
      o.objective_title as objective,
      o.objective_narrative as narrative,
      o.id_department_plan as planId
    FROM objectives o
    WHERE o.id_objective = ? AND o.deleted_at IS NULL
  `;

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching objective:", err);
      res.status(500).json({ error: "Failed to fetch objective" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "Objective not found" });
      return;
    }
    res.json(results[0]);
  });
});

// Create a new objective
router.post("/", async (req, res) => {
  const { planId, objective, narrative } = req.body;
  const createdBy = 1; // Hardcoded Admin User for MVP

  const promisePool = pool.promise();

  try {
    // 1. Get 'Draft' status ID for OBJECTIVE
    const [statuses] = await promisePool.query(
      `SELECT sv.id_status_value 
       FROM status_values sv 
       JOIN status_types st ON sv.id_status_type = st.id_status_type 
       WHERE st.status_type_code = 'OBJECTIVE' AND sv.status_code = 'DRAFT'`
    );

    if (statuses.length === 0) {
      throw new Error("Draft status for OBJECTIVE not found");
    }
    const statusId = statuses[0].id_status_value;

    // 2. Get Department ID from Plan
    const [plans] = await promisePool.query(
      "SELECT id_department FROM department_plans WHERE id_department_plan = ?",
      [planId]
    );

    if (plans.length === 0) {
      throw new Error("Department Plan not found");
    }
    const departmentId = plans[0].id_department;

    // 3. Insert Objective
    const [result] = await promisePool.query(
      `INSERT INTO objectives 
       (id_department_plan, objective_title, objective_narrative, id_department_owner, id_status_value) 
       VALUES (?, ?, ?, ?, ?)`,
      [planId, objective, narrative, departmentId, statusId]
    );

    res
      .status(201)
      .json({ id: result.insertId, message: "Objective created successfully" });
  } catch (err) {
    console.error("Error creating objective:", err);
    res
      .status(500)
      .json({ error: "Failed to create objective", details: err.message });
  }
});

// Update an objective
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { planId, objective, narrative } = req.body;

  const promisePool = pool.promise();

  try {
    // Check if objective exists
    const [existing] = await promisePool.query(
      "SELECT * FROM objectives WHERE id_objective = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Objective not found" });
    }

    // Update
    await promisePool.query(
      `UPDATE objectives 
       SET id_department_plan = ?, objective_title = ?, objective_narrative = ?
       WHERE id_objective = ?`,
      [planId, objective, narrative, id]
    );

    res.json({ message: "Objective updated successfully" });
  } catch (err) {
    console.error("Error updating objective:", err);
    res.status(500).json({ error: "Failed to update objective" });
  }
});

module.exports = router;
