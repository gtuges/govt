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

// Get all department plans (missions/visions)
router.get("/", (req, res) => {
  const query = `
    SELECT 
      dp.id_department_plan as id,
      dp.mission,
      dp.vision,
      DATE_FORMAT(pp.start_date, '%Y-%m-%d') as startDate,
      DATE_FORMAT(pp.end_date, '%Y-%m-%d') as endDate,
      sv.status_name as status
    FROM department_plans dp
    JOIN plan_periods pp ON dp.id_plan_period = pp.id_plan_period
    JOIN status_values sv ON dp.id_status_value = sv.id_status_value
    WHERE dp.deleted_at IS NULL
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching department plans:", err);
      res.status(500).json({ error: "Failed to fetch data" });
      return;
    }
    res.json(results);
  });
});

// Create a new department plan (mission/vision)
router.post("/", async (req, res) => {
  const { departmentId, startDate, endDate, mission, vision } = req.body;
  const orgId = 1; // Hardcoded for MVP
  const createdBy = 1; // Hardcoded Admin User for MVP

  const promisePool = pool.promise();

  try {
    // 1. Find or Create Plan Period
    let planPeriodId;
    const [periods] = await promisePool.query(
      "SELECT id_plan_period FROM plan_periods WHERE id_org = ? AND start_date = ? AND end_date = ?",
      [orgId, startDate, endDate]
    );

    if (periods.length > 0) {
      planPeriodId = periods[0].id_plan_period;
    } else {
      const [result] = await promisePool.query(
        "INSERT INTO plan_periods (id_org, start_date, end_date) VALUES (?, ?, ?)",
        [orgId, startDate, endDate]
      );
      planPeriodId = result.insertId;
    }

    // 2. Get 'Draft' status ID
    const [statuses] = await promisePool.query(
      `SELECT sv.id_status_value 
       FROM status_values sv 
       JOIN status_types st ON sv.id_status_type = st.id_status_type 
       WHERE st.status_type_code = 'PLAN' AND sv.status_code = 'DRAFT'`
    );

    if (statuses.length === 0) {
      throw new Error("Draft status not found");
    }
    const statusId = statuses[0].id_status_value;

    // 3. Insert Department Plan
    const [planResult] = await promisePool.query(
      `INSERT INTO department_plans 
       (id_org, id_department, id_plan_period, mission, vision, id_status_value, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, departmentId, planPeriodId, mission, vision, statusId, createdBy]
    );

    res
      .status(201)
      .json({
        id: planResult.insertId,
        message: "Mission created successfully",
      });
  } catch (err) {
    console.error("Error creating department plan:", err);
    res
      .status(500)
      .json({ error: "Failed to create mission", details: err.message });
  }
});

// Update mission status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const promisePool = pool.promise();

  try {
    // Get status ID for the new status
    const [statuses] = await promisePool.query(
      `SELECT sv.id_status_value 
       FROM status_values sv 
       JOIN status_types st ON sv.id_status_type = st.id_status_type 
       WHERE st.status_type_code = 'PLAN' AND sv.status_name = ?`,
      [status]
    );

    if (statuses.length === 0) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const statusId = statuses[0].id_status_value;

    // Update the department plan status
    const [result] = await promisePool.query(
      `UPDATE department_plans 
       SET id_status_value = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id_department_plan = ? AND deleted_at IS NULL`,
      [statusId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating mission status:", err);
    res
      .status(500)
      .json({ error: "Failed to update status", details: err.message });
  }
});

module.exports = router;
