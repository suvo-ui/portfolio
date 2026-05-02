import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import uploadRoutes from "./routes/upload.js";
import adminRoutes from "./routes/admin.js";
import artworksRoutes from "./routes/artworks.js";
import printsRoutes from "./routes/prints.js";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import courseRoutes from "./routes/courses.js";
import courseDemoVideoRoutes from "./routes/courseDemoVideos.js";
import categoriesRoutes from "./routes/categories.js";
import workshopRoutes from "./routes/workshops.js";
import heroCarouselRoutes from "./routes/heroCarousel.js";

import corsOptions from "./config/cors.js";
import sql from "./config/db.js";
import requireTrustedOrigin from "./middlewares/requireTrustedOrigin.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ---------- Security Middleware ---------- */
app.use(helmet());

/* ---------- CORS ---------- */
app.use(cors(corsOptions));

/* ---------- Body & Cookie Parsers ---------- */
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));
app.use(cookieParser());
app.use(requireTrustedOrigin);

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
app.use("/api/prints", printsRoutes); // 🖨️ prints
app.use("/api/auth", authRoutes); // 🔑 auth
app.use("/api", contactRoutes); // ✉️ contact
app.use("/api/course", courseRoutes); // 📚 course
app.use("/api/course-demo-videos", courseDemoVideoRoutes); // 🎬 course demo videos
app.use("/api", categoriesRoutes); // 🏷 categories
app.use("/api/workshops", workshopRoutes); // 🎥 workshops
app.use("/api/hero-carousel", heroCarouselRoutes); // 🎠 hero carousel

if (process.env.NODE_ENV !== "production") {
  app.get("/api/db-test", async (req, res) => {
    try {
      const result = await sql`SELECT NOW()`;
      res.json({
        success: true,
        time: result[0].now,
      });
    } catch (err) {
      console.error("DB ERROR:", err);
      res.status(500).json({ error: "DB test failed" });
    }
  });
}

/* ---------- 404 Handler ---------- */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  if (statusCode >= 500) {
    console.error("GLOBAL ERROR:", err);
  }

  res.status(statusCode).json({
    error: statusCode < 500 ? err.message : "Internal Server Error",
  });
});

export default app;
