const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRouter = require("./routes");
const pool = require("./db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/connect", (req, res) => {
  pool.query("SELECT * FROM users LIMIT 1", (err, results) => {
    if (err) {
      console.error("Error executing query:", err.stack);
      res
        .status(500)
        .json({ error: "Database connection failed", details: err.message });
      return;
    }
    res.json({ message: "Connection successful", data: results });
  });
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
