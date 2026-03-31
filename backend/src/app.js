import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import uploadRoutes from "./routes/upload.js";
import adminRoutes from "./routes/admin.js";
import artworksRoutes from "./routes/artworks.js";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import courseRoutes from "./routes/courses.js";
import categoriesRoutes from "./routes/categories.js";
import workshopRoutes from "./routes/workshops.js";

import sql from "./config/db.js";

const app = express();

/* ---------- Security Middleware ---------- */
app.use(helmet());

/* ---------- CORS ---------- */
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);

/* ---------- Body & Cookie Parsers ---------- */
app.use(express.json());
app.use(cookieParser());

/* ---------- Health Check ---------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* ---------- Root Route ---------- */
app.get("/", (req, res) => {
  res.send("<h1>Hello World from Express!</h1>");
});

/* ---------- API Routes ---------- */
app.use("/api/upload", uploadRoutes); // 🔼 artwork uploads
app.use("/api/admin", adminRoutes); // 🔐 admin actions
app.use("/api/artworks", artworksRoutes); // 🎨 gallery
app.use("/api/auth", authRoutes); // 🔑 auth
app.use("/api", contactRoutes); // ✉️ contact
app.use("/api/course", courseRoutes); // 📚 course
app.use("/api", categoriesRoutes); // 🏷 categories
app.use("/api/workshops", workshopRoutes); // 🎥 workshops

/* ---------- DB Test ---------- */
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({
      success: true,
      time: result[0].now,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- 404 Handler ---------- */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
