const { Pool } = require("pg");

const pool = new Pool({
  host: "mini-shopify-postgres",
  user: "shopify",
  password: "shopify",
  database: "shopify_db",
  port: 5432
});

module.exports = pool;