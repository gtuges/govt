const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const createUploadMiddleware = require("../middleware/upload");
const upload = createUploadMiddleware("activity_files");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Auto-migration for activity_files table
const ensureFilesTable = async () => {
  try {
    const promisePool = pool.promise();
    await promisePool.query(`
            CREATE TABLE IF NOT EXISTS activity_files (
              id_file BIGINT PRIMARY KEY AUTO_INCREMENT,
              id_activity BIGINT NOT NULL,
              file_name VARCHAR(255) NOT NULL,
              original_name VARCHAR(255) NULL,
              file_path VARCHAR(500) NOT NULL,
              file_type VARCHAR(100) NULL,
              file_size BIGINT NULL,
              uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_activity_files_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    // Add file_size column if missing (for existing tables)
    await promisePool
      .query(
        `
            ALTER TABLE activity_files ADD COLUMN IF NOT EXISTS file_size BIGINT NULL
        `
      )
      .catch(() => {}); // Ignore error if column exists
    console.log("Ensured activity_files table exists");
  } catch (e) {
    console.error("Failed to ensure activity_files table:", e);
  }
};
ensureFilesTable();

// Get budget categories
router.get("/budget-categories", async (req, res) => {
  try {
    const promisePool = pool.promise();
    const [rows] = await promisePool.query(
      "SELECT id_budget_category as id, category_name as name FROM budget_categories ORDER BY category_name"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching budget categories:", err);
    res.status(500).json({ error: "Failed to fetch budget categories" });
  }
});

// Get all activities
router.get("/", (req, res) => {
  const query = `
    SELECT 
      a.id_activity as id,
      a.id_objective,
      a.activity_title,
      a.activity_description,
      a.color_code as color,
      DATE_FORMAT(a.start_date, '%Y-%m-%d') as startDate,
      DATE_FORMAT(a.end_date, '%Y-%m-%d') as endDate,
      o.objective_title,
      sv.status_name as status
    FROM activities a
    JOIN objectives o ON a.id_objective = o.id_objective
    JOIN status_values sv ON a.id_status_value = sv.id_status_value
    WHERE a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching activities:", err);
      res.status(500).json({ error: "Failed to fetch activities" });
      return;
    }
    res.json(results);
  });
});

// Get single activity
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const promisePool = pool.promise();

  try {
    const [activities] = await promisePool.query(
      `SELECT 
        a.id_activity as id,
        a.activity_title as title,
        a.activity_description as description,
        a.color_code as color,
        DATE_FORMAT(a.start_date, '%Y-%m-%d') as startDate,
        DATE_FORMAT(a.end_date, '%Y-%m-%d') as endDate,
        a.id_objective as objectiveId
      FROM activities a
      WHERE a.id_activity = ? AND a.deleted_at IS NULL`,
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const activity = activities[0];

    // Fetch budget lines
    const [budgetLines] = await promisePool.query(
      `SELECT 
        id_budget_line as id,
        id_budget_category as categoryId,
        line_description as description,
        qty as quantity,
        unit_cost as unitCost
      FROM budget_lines 
      WHERE id_activity = ? AND deleted_at IS NULL`,
      [id]
    );

    activity.budget = budgetLines;
    res.json(activity);
  } catch (err) {
    console.error("Error fetching activity:", err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Create a new activity
router.post("/", async (req, res) => {
  const { objectiveId, title, description, startDate, endDate, color, budget } =
    req.body;

  const promisePool = pool.promise();

  try {
    // 1. Get 'Not Started' status ID for ACTIVITY
    const [statuses] = await promisePool.query(
      `SELECT sv.id_status_value 
       FROM status_values sv 
       JOIN status_types st ON sv.id_status_type = st.id_status_type 
       WHERE st.status_type_code = 'ACTIVITY' AND sv.status_code = 'NOT STARTED'`
    );

    if (statuses.length === 0) {
      throw new Error("Default status for ACTIVITY not found");
    }
    const statusId = statuses[0].id_status_value;

    // 2. Insert Activity
    const [result] = await promisePool.query(
      `INSERT INTO activities 
       (id_objective, activity_title, activity_description, start_date, end_date, id_status_value, color_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        objectiveId,
        title,
        description,
        startDate,
        endDate,
        statusId,
        color || "#3b82f6",
      ]
    );

    const newActivityId = result.insertId;

    // 3. Insert Budget Lines
    if (budget && Array.isArray(budget) && budget.length > 0) {
      const budgetValues = budget.map((item) => [
        newActivityId,
        item.categoryId,
        item.description || "",
        item.quantity || 1,
        item.unitCost || 0,
      ]);

      if (budgetValues.length > 0) {
        await promisePool.query(
          `INSERT INTO budget_lines 
           (id_activity, id_budget_category, line_description, qty, unit_cost) 
           VALUES ?`,
          [budgetValues]
        );
      }
    }

    // Fetch the created activity
    const [newActivity] = await promisePool.query(
      `SELECT 
        a.id_activity as id,
        a.id_objective,
        a.activity_title,
        a.activity_description,
        a.color_code as color,
        DATE_FORMAT(a.start_date, '%Y-%m-%d') as startDate,
        DATE_FORMAT(a.end_date, '%Y-%m-%d') as endDate,
        o.objective_title,
        sv.status_name as status
      FROM activities a
      JOIN objectives o ON a.id_objective = o.id_objective
      JOIN status_values sv ON a.id_status_value = sv.id_status_value
      WHERE a.id_activity = ?`,
      [result.insertId]
    );

    res.status(201).json(newActivity[0]);
  } catch (err) {
    console.error("Error creating activity:", err);
    res
      .status(500)
      .json({ error: "Failed to create activity", details: err.message });
  }
});

// Update an activity
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { objectiveId, title, description, startDate, endDate, color, budget } =
    req.body;

  const promisePool = pool.promise();

  try {
    // Check if activity exists
    const [existing] = await promisePool.query(
      "SELECT * FROM activities WHERE id_activity = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    // Update Activity
    await promisePool.query(
      `UPDATE activities 
       SET id_objective = ?, activity_title = ?, activity_description = ?, start_date = ?, end_date = ?, color_code = ?
       WHERE id_activity = ?`,
      [objectiveId, title, description, startDate, endDate, color, id]
    );

    // Update Budget Lines using Replace Strategy (Soft Delete All + Insert New)

    // 1. Soft delete all existing lines
    await promisePool.query(
      "UPDATE budget_lines SET deleted_at = NOW() WHERE id_activity = ?",
      [id]
    );

    // 2. Insert new lines
    if (budget && Array.isArray(budget) && budget.length > 0) {
      const budgetValues = budget.map((item) => [
        id,
        item.categoryId,
        item.description || "",
        item.quantity || 1,
        item.unitCost || 0,
      ]);

      if (budgetValues.length > 0) {
        await promisePool.query(
          `INSERT INTO budget_lines 
           (id_activity, id_budget_category, line_description, qty, unit_cost) 
           VALUES ?`,
          [budgetValues]
        );
      }
    }

    // Fetch updated activity
    const [updated] = await promisePool.query(
      `SELECT 
        a.id_activity as id,
        a.id_objective,
        a.activity_title,
        a.activity_description,
        a.color_code as color,
        DATE_FORMAT(a.start_date, '%Y-%m-%d') as startDate,
        DATE_FORMAT(a.end_date, '%Y-%m-%d') as endDate,
        o.objective_title,
        sv.status_name as status
      FROM activities a
      JOIN objectives o ON a.id_objective = o.id_objective
      JOIN status_values sv ON a.id_status_value = sv.id_status_value
      WHERE a.id_activity = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error("Error updating activity:", err);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Delete an activity (Soft delete)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const promisePool = pool.promise();

  try {
    await promisePool.query(
      "UPDATE activities SET deleted_at = NOW() WHERE id_activity = ?",
      [id]
    );
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    console.error("Error deleting activity:", err);
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

// --- Budget Line CRUD Routes ---

// Create a budget line for an activity
router.post("/:id/budget", async (req, res) => {
  const { id } = req.params;
  const { categoryId, description, quantity, unitCost } = req.body;

  const promisePool = pool.promise();
  try {
    // Verify activity exists
    const [activity] = await promisePool.query(
      "SELECT id_activity FROM activities WHERE id_activity = ? AND deleted_at IS NULL",
      [id]
    );
    if (activity.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const [result] = await promisePool.query(
      `INSERT INTO budget_lines (id_activity, id_budget_category, line_description, qty, unit_cost) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, categoryId, description || "", quantity || 1, unitCost || 0]
    );

    res.status(201).json({
      id: result.insertId,
      categoryId,
      description: description || "",
      quantity: quantity || 1,
      unitCost: unitCost || 0,
    });
  } catch (err) {
    console.error("Error creating budget line:", err);
    res.status(500).json({ error: "Failed to create budget line" });
  }
});

// Update a budget line
router.put("/:id/budget/:lineId", async (req, res) => {
  const { id, lineId } = req.params;
  const { categoryId, description, quantity, unitCost } = req.body;

  const promisePool = pool.promise();
  try {
    // Verify budget line exists and belongs to activity
    const [existing] = await promisePool.query(
      "SELECT * FROM budget_lines WHERE id_budget_line = ? AND id_activity = ? AND deleted_at IS NULL",
      [lineId, id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Budget line not found" });
    }

    await promisePool.query(
      `UPDATE budget_lines 
       SET id_budget_category = ?, line_description = ?, qty = ?, unit_cost = ?, updated_at = NOW()
       WHERE id_budget_line = ?`,
      [categoryId, description || "", quantity || 1, unitCost || 0, lineId]
    );

    res.json({
      id: parseInt(lineId),
      categoryId,
      description: description || "",
      quantity: quantity || 1,
      unitCost: unitCost || 0,
    });
  } catch (err) {
    console.error("Error updating budget line:", err);
    res.status(500).json({ error: "Failed to update budget line" });
  }
});

// Delete a budget line (soft delete)
router.delete("/:id/budget/:lineId", async (req, res) => {
  const { id, lineId } = req.params;

  const promisePool = pool.promise();
  try {
    const [existing] = await promisePool.query(
      "SELECT * FROM budget_lines WHERE id_budget_line = ? AND id_activity = ? AND deleted_at IS NULL",
      [lineId, id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Budget line not found" });
    }

    await promisePool.query(
      "UPDATE budget_lines SET deleted_at = NOW() WHERE id_budget_line = ?",
      [lineId]
    );

    res.json({ message: "Budget line deleted" });
  } catch (err) {
    console.error("Error deleting budget line:", err);
    res.status(500).json({ error: "Failed to delete budget line" });
  }
});

// --- File Handling Routes ---

// Upload file for activity
router.post("/:id/files", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const promisePool = pool.promise();
  try {
    // Ensure activity exists
    const [activity] = await promisePool.query(
      "SELECT id_activity FROM activities WHERE id_activity = ?",
      [id]
    );
    if (activity.length === 0) {
      // cleanup file
      fs.unlink(file.path, () => {});
      return res.status(404).json({ error: "Activity not found" });
    }

    const [result] = await promisePool.query(
      `INSERT INTO activity_files (id_activity, file_name, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        file.filename,
        file.originalname,
        file.path,
        file.mimetype,
        file.size,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      id_activity: id,
      file_name: file.filename,
      original_name: file.originalname,
      file_size: file.size,
      uploaded_at: new Date(),
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    // Try to cleanup
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Get files for activity
router.get("/:id/files", async (req, res) => {
  const { id } = req.params;
  const promisePool = pool.promise();
  try {
    const [files] = await promisePool.query(
      "SELECT id_file as id, file_name, original_name, file_size, uploaded_at FROM activity_files WHERE id_activity = ? ORDER BY uploaded_at DESC",
      [id]
    );
    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Delete file
router.delete("/:id/files/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const promisePool = pool.promise();
  try {
    const [files] = await promisePool.query(
      "SELECT * FROM activity_files WHERE id_file = ?",
      [fileId]
    );
    if (files.length === 0)
      return res.status(404).json({ error: "File not found" });

    const file = files[0];

    // Delete from DB
    await promisePool.query("DELETE FROM activity_files WHERE id_file = ?", [
      fileId,
    ]);

    // Delete from FS
    if (fs.existsSync(file.file_path)) {
      fs.unlink(file.file_path, (err) => {
        if (err) console.error("Error deleting physical file:", err);
      });
    }

    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Serve File Content (Simple download)
router.get("/:id/files/:fileId/download", async (req, res) => {
  const { fileId } = req.params;
  const promisePool = pool.promise();
  try {
    const [files] = await promisePool.query(
      "SELECT * FROM activity_files WHERE id_file = ?",
      [fileId]
    );
    if (files.length === 0)
      return res.status(404).json({ error: "File not found" });

    const file = files[0];
    if (fs.existsSync(file.file_path)) {
      res.download(file.file_path, file.original_name);
    } else {
      res.status(404).json({ error: "Physical file missing" });
    }
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
});

module.exports = router;
