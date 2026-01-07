const mysql = require("mysql2/promise");
require("dotenv").config();

async function seedCategories() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const categories = [
    "Personnel & Salaries",
    "Travel & Transportation",
    "Equipment & Supplies",
    "Venue & Facilities",
    "Catering & Refreshments",
    "Professional Services",
    "Training & Development",
    "Marketing & Communications",
    "IT & Technology",
    "Miscellaneous",
  ];

  console.log("Seeding budget categories...");

  for (const cat of categories) {
    try {
      await conn.execute(
        "INSERT IGNORE INTO budget_categories (id_org, category_name) VALUES (1, ?)",
        [cat]
      );
      console.log("✓ Added:", cat);
    } catch (e) {
      console.log("✗ Skipped:", cat, e.message);
    }
  }

  await conn.end();
  console.log("\nDone!");
}

seedCategories().catch(console.error);
