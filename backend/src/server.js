import "dotenv/config";

import app from "./app.js";
import { ensureSchemaReady } from "./config/schema.js";

const PORT = process.env.PORT || 5000;

try {
  await ensureSchemaReady();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to initialize server schema:", error);
  process.exit(1);
}
