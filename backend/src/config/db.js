import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "exchangedb",
  password: process.env.DB_PASSWORD || "strongpassword",
  port: process.env.DB_PORT || 5432,
});
await pool.query("SET search_path TO public");

export default pool;