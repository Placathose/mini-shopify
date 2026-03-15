const express = require("express");
const router = express.Router();

const {
  getInventory,
  updateInventory
} = require("../models/inventory");

router.get("/:productId", async (req, res) => {
  try {
    const result = await getInventory(req.params.productId);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: "Quantity required" });
    }

    const result = await updateInventory(req.params.productId, quantity);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating inventory:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;