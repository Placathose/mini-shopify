const express = require("express");
const app = express();

const inventoryRoutes = require("./routes/inventory");

app.use(express.json());

app.use("/inventory", inventoryRoutes);

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});