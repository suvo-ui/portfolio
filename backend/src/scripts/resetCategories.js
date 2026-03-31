import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const resetCategories = async () => {
  try {
    // Delete all existing categories
    await pool.query("DELETE FROM categories");

    // Insert new categories
    const newCategories = [
      "Bestsellers",
      "Fresh Arrivals",
      "Available Now",
      "Statement Pieces",
    ];

    for (const category of newCategories) {
      await pool.query("INSERT INTO categories (name) VALUES ($1)", [category]);
    }

    console.log("✅ Categories reset successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting categories:", err.message);
    process.exit(1);
  }
};

resetCategories();
