const db = require("../db");

const getAllProducts = async () => {
  return db.query("SELECT * FROM products ORDER BY id ASC");
};

const getProductById = async (id) => {
  return db.query("SELECT * FROM products WHERE id = $1", [id]);
};

const createProduct = async (name, price, inventory = 0) => {
  return db.query(
    `INSERT INTO products (name, price, inventory)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, price, inventory]
  );
};

const updateProduct = async (id, name, price, inventory) => {
  const updates = [];
  const values = [id];
  let paramCount = 2;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (price !== undefined) {
    updates.push(`price = $${paramCount++}`);
    values.push(price);
  }

  if (inventory !== undefined) {
    updates.push(`inventory = $${paramCount++}`);
    values.push(inventory);
  }

  if (updates.length === 0) {
    return { rows: [] };
  }

  return db.query(
    `UPDATE products
     SET ${updates.join(", ")}
     WHERE id = $1
     RETURNING *`,
    values
  );
};

const deleteProduct = async (id) => {
  return db.query("DELETE FROM products WHERE id = $1", [id]);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};