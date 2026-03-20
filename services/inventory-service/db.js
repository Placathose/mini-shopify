const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  user: process.env.DB_USER || "shopify",
  password: process.env.DB_PASSWORD || "shopify",
  database: process.env.DB_NAME || "shopify_db",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

const schemaSql = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    inventory INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const ensureSchema = async () => {
  try {
    await pool.query(schemaSql);
  } catch (err) {
    // When both services start at the same time, `SERIAL` sequence creation can race.
    // If this happens, the tables should already exist, so we can safely proceed.
    if (err && err.code === "23505") return;
    throw err;
  }
};

module.exports = pool;
module.exports.ensureSchema = ensureSchema;