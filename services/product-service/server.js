const express = require("express");
require("dotenv").config();

const productRoutes = require("./routes/products");
const db = require("./db");

const app = express();

app.use(express.json());

app.use("/products", productRoutes);

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await db.ensureSchema();
  } catch (err) {
    console.error("Failed to ensure database schema:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
  });
})();