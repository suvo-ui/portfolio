const express = require("express");
const cors = require("cors");

const app = express();

const pool = require("./config/db.js");

/* ---------- Middlewares ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Health Check ---------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.send("<h1>Hello World from Express!</h1>");
});

/* ---------- Routes (placeholders for now) ---------- */
// app.use("/api/artworks", artworkRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/admin", adminRoutes);

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
