import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
// Supabase/pooled Postgres connections can invalidate prepared statements
// between requests, so disable them at the client layer.
const sql = postgres(connectionString, {
  prepare: false,
});

export default sql;
