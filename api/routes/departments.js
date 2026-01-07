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

router.get("/", (req, res) => {
  const query =
    "SELECT id_department, department_name FROM departments WHERE deleted_at IS NULL";
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching departments:", err);
      res.status(500).json({ error: "Failed to fetch departments" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;
