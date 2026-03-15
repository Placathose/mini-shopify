const db = require("../db");

const getInventory = async (productId) => {
  return db.query(
    "SELECT * FROM inventory WHERE product_id = $1",
    [productId]
  );
};

const updateInventory = async (productId, quantity) => {
  return db.query(
    `UPDATE inventory
     SET quantity = $2, updated_at = NOW()
     WHERE product_id = $1
     RETURNING *`,
    [productId, quantity]
  );
};

module.exports = {
  getInventory,
  updateInventory
};