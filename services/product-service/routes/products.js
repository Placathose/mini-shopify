const express = require("express");

const {
  getAllProducts,
  getProductById,
  createProduct,
  deleteProduct,
  updateProduct
} = require("../models/products");

const router = express.Router();

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://inventory-service:4000";

const getInventoryQuantity = async (productId) => {
  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/${productId}`
  );

  if (response.status === 404) return 0;
  if (!response.ok) {
    throw new Error(`Inventory service responded with ${response.status}`);
  }

  const data = await response.json();
  return data.quantity ?? 0;
};

const upsertInventory = async (productId, quantity) => {
  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/${productId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity })
    }
  );

  if (!response.ok) {
    throw new Error(`Inventory upsert failed with ${response.status}`);
  }

  return response.json();
};

router.get("/", async (req, res) => {
  const result = await getAllProducts();
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getProductById(req.params.id);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];
    const inventoryQuantity = await getInventoryQuantity(product.id);

    // Always take inventory from inventory-service.
    res.json({ ...product, inventory: inventoryQuantity });
  } catch (err) {
    console.error("Error fetching product/inventory:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, price, inventory } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price required" });
    }

    const result = await createProduct(name, price, inventory ?? 0);
    const product = result.rows[0];

    // Keep inventory-service in sync (upsert will create row if missing).
    await upsertInventory(product.id, inventory ?? product.inventory ?? 0);

    const inventoryQuantity = await getInventoryQuantity(product.id);
    res.status(201).json({ ...product, inventory: inventoryQuantity });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, inventory } = req.body;

    const result = await updateProduct(id, name, price, inventory);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];

    // If the client provided inventory, update it in inventory-service.
    if (inventory !== undefined) {
      await upsertInventory(product.id, inventory);
    }

    // Always respond with the inventory-service value.
    const inventoryQuantity = await getInventoryQuantity(product.id);
    res.json({ ...product, inventory: inventoryQuantity });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;