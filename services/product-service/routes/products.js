const express = require("express");
const router = express.Router();
const axios = require("axios");

const { getProductById } = require("../models/products");

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const productResult = await getProductById(id);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult.rows[0];

    // Call inventory service
    let inventory = null;

    try {
      const response = await axios.get(
        `${process.env.INVENTORY_SERVICE_URL}/inventory/${id}`
      );
      inventory = response.data.quantity;
    } catch (err) {
      console.log("Inventory service error:", err.message);
    }

    res.json({
      ...product,
      inventory
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;