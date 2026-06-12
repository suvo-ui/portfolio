import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const rows = await sql`
  SELECT id, title, image_url, image_variants 
  FROM artworks 
  WHERE id = 63 
  LIMIT 1
`;

console.log(JSON.stringify(rows, null, 2));

await sql.end({ timeout: 5 });
