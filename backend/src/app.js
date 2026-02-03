import express from "express";
import cors from "cors";

import uploadRoutes from "./routes/upload.js";
import adminRoutes from "./routes/admin.js";
import artworksRoutes from "./routes/artworks.js";
import sql from "./config/db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";

const app = express();

/* ---------- Middlewares ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Health Check ---------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* ---------- Root Route ---------- */
app.get("/", (req, res) => {
  res.send("<h1>Hello World from Express!</h1>");
});

/* ---------- API Routes ---------- */
app.use("/api/upload", uploadRoutes); // Cloudinary upload
app.use("/api/admin", adminRoutes); // Save artwork to DB
app.use("/api/artworks", artworksRoutes); // Fetch artworks for gallery
app.use("/api/auth", authRoutes);
app.use("/api/course", courseRoutes);


/* ---------- Database Test ---------- */
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({
      success: true,
      time: result[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
