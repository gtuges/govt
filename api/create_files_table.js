const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sql = `
CREATE TABLE IF NOT EXISTS activity_files (
  id_file BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_files_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

connection.query(sql, (err, results) => {
  if (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  } else {
    console.log("Table 'activity_files' created or already exists.");
    process.exit(0);
  }
});
