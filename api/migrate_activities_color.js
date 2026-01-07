const mysql = require("mysql2");
require("dotenv").config({ path: "../../.env" }); // Adjust path to .env if needed, assuming run from api/scripts

// Fallback to local .env if running from root
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

async function migrate() {
  const promisePool = pool.promise();

  console.log(
    "Checking if 'color_code' column exists in 'activities' table..."
  );

  try {
    const [rows] = await promisePool.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'color_code'
    `,
      [process.env.DB_NAME]
    );

    if (rows.length === 0) {
      console.log("Adding 'color_code' column...");
      await promisePool.query(`
        ALTER TABLE activities 
        ADD COLUMN color_code VARCHAR(7) NULL DEFAULT '#3b82f6' AFTER end_date
      `);
      console.log("Successfully added 'color_code' column.");
    } else {
      console.log("'color_code' column already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
