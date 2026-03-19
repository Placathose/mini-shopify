const db = require("../db");

const getProductById = async (id) => {
  return db.query("SELECT * FROM products WHERE id = $1", [id]);
};

module.exports = {
  getProductById
};