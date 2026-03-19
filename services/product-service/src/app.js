const express = require("express");
const app = express();

const productRoutes = require("../routes/products");

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 👇 THIS LINE IS REQUIRED
app.use("/products", productRoutes);

module.exports = app;