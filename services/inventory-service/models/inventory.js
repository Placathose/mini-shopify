const db = require("../db");

const getInventory = async (productId) => {
  return db.query(
    "SELECT * FROM inventory WHERE product_id = $1",
    [productId]
  );
};

const updateInventory = async (productId, quantity) => {
  return db.query(
    `INSERT INTO inventory (product_id, quantity, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id)
     DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
     RETURNING *`,
    [productId, quantity]
  );
};

module.exports = {
  getInventory,
  updateInventory
};