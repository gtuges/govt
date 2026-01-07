const mysql = require("mysql2/promise");
require("dotenv").config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Connected to database...");

    // 1. Create Organization
    const [orgs] = await connection.execute("SELECT * FROM orgs LIMIT 1");
    let orgId;
    if (orgs.length === 0) {
      const [res] = await connection.execute(
        "INSERT INTO orgs (org_name) VALUES (?)",
        ["Government of Testland"]
      );
      orgId = res.insertId;
      console.log("Created Organization:", orgId);
    } else {
      orgId = orgs[0].id_org;
      console.log("Using existing Organization:", orgId);
    }

    // 2. Create Departments
    const departments = ["Health", "Education", "Infrastructure"];
    for (const dept of departments) {
      const [rows] = await connection.execute(
        "SELECT * FROM departments WHERE department_name = ?",
        [dept]
      );
      if (rows.length === 0) {
        await connection.execute(
          "INSERT INTO departments (id_org, department_name) VALUES (?, ?)",
          [orgId, dept]
        );
        console.log(`Created Department: ${dept}`);
      }
    }

    // 3. Create Status Types and Values
    const statusTypes = [
      {
        code: "PLAN",
        name: "Plan Status",
        values: ["Draft", "Active", "Archived"],
      },
      {
        code: "OBJECTIVE",
        name: "Objective Status",
        values: ["Draft", "Active", "Completed", "Cancelled"],
      },
      {
        code: "ACTIVITY",
        name: "Activity Status",
        values: ["Not Started", "In Progress", "Completed", "Blocked"],
      },
    ];

    for (const type of statusTypes) {
      let typeId;
      const [rows] = await connection.execute(
        "SELECT * FROM status_types WHERE status_type_code = ?",
        [type.code]
      );
      if (rows.length === 0) {
        const [res] = await connection.execute(
          "INSERT INTO status_types (status_type_code, status_type_name) VALUES (?, ?)",
          [type.code, type.name]
        );
        typeId = res.insertId;
        console.log(`Created Status Type: ${type.code}`);
      } else {
        typeId = rows[0].id_status_type;
      }

      for (const val of type.values) {
        const [vRows] = await connection.execute(
          "SELECT * FROM status_values WHERE id_status_type = ? AND status_code = ?",
          [typeId, val.toUpperCase()]
        );
        if (vRows.length === 0) {
          await connection.execute(
            "INSERT INTO status_values (id_status_type, status_code, status_name) VALUES (?, ?, ?)",
            [typeId, val.toUpperCase(), val]
          );
          console.log(`Created Status Value: ${val}`);
        }
      }
    }

    // 4. Create Admin User
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      ["admin@gov.test"]
    );
    if (users.length === 0) {
      await connection.execute(
        `
        INSERT INTO users (id_org, full_name, email, password_hash) 
        VALUES (?, ?, ?, ?)
      `,
        [orgId, "Admin User", "admin@gov.test", "hashed_password_placeholder"]
      );
      console.log("Created Admin User");
    }

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await connection.end();
  }
}

seed();
