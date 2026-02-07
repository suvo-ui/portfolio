import "dotenv/config";
import bcrypt from "bcrypt";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createAdmin = async () => {
  try {
    const email = "paperslayer99@gmail.com";       // change later
    const password = "LiquidCh@os99";    // change later

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO admins (email, password_hash) VALUES ($1, $2)",
      [email, passwordHash]
    );

    console.log("✅ Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();
