# mini-shopify (Products + Inventory)

This repo contains two small Express services backed by PostgreSQL:

- `product-service` exposes product endpoints under `/products`
- `inventory-service` exposes inventory endpoints under `/inventory`

The intended behavior is: when you request a product, you should receive its `inventory` coming from `inventory-service`.

---

## What was happening (the “Server error”)

When calling:

- `GET http://localhost:3001/products/7`

you were getting a generic response:

- `{"error":"Server error"}`

Two issues were responsible:

1. **Postgres had no tables at all.**
   - The product service queries the `products` table.
   - Because the database schema wasn’t created, the query failed and Express returned the generic 500.
2. **The services were not wired for inventory lookup.**
   - The product endpoint returned product data directly from `products`, instead of calling `inventory-service` to fetch `inventory`.

---

## What I changed to fix it

### 1) Create the schema on startup (`ensureSchema()`)

Both services now ensure the tables exist on boot:

- `product-service` runs `await db.ensureSchema()` before it starts listening
- `inventory-service` runs `await db.ensureSchema()` before it starts listening

This is implemented like this in `product-service/server.js`:

```js
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
```

And in `inventory-service/server.js`:

```js
(async () => {
  try {
    await db.ensureSchema();
  } catch (err) {
    console.error("Failed to ensure database schema:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Inventory service running on port ${PORT}`);
  });
})();
```

The schema includes:

```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  inventory INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

To make startup safe when both services initialize at the same time, the schema creation ignores a specific PostgreSQL duplicate-key race (caused by concurrent `SERIAL` sequence creation).

### 2) Inventory updates now use an upsert

In `inventory-service/models/inventory.js`, `updateInventory` was changed so it inserts the inventory row if it doesn’t exist yet:

```js
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
```

This ensures inventory synchronization works reliably during product creation.

### 3) `GET /products/:id` now fetches inventory from `inventory-service`

In `product-service/routes/products.js`, `GET /products/:id` now calls:

- `inventory-service` at `http://inventory-service:4000/inventory/:productId`

Then it merges that quantity into the product response:

```js
const inventoryQuantity = await getInventoryQuantity(product.id);
res.json({ ...product, inventory: inventoryQuantity });
```

If you want to point it at a different host, you can set:

- `INVENTORY_SERVICE_URL` (defaults to `http://inventory-service:4000`)

### 4) Fix product-service dev entrypoint

`product-service/package.json` was updated so the dev script runs the correct file:

- from `nodemon src/server.js`
- to `nodemon server.js`

This matters because the current service entry is `services/product-service/server.js`.

---

## Code locations changed

- `services/product-service/db.js` (added)
- `services/product-service/server.js` (schema ensure on startup)
- `services/product-service/routes/products.js` (fetch inventory from inventory-service)
- `services/product-service/package.json` (dev script fixed)
- `services/inventory-service/db.js` (schema ensure on startup)
- `services/inventory-service/server.js` (schema ensure on startup)
- `services/inventory-service/models/inventory.js` (inventory upsert)

---

## Quick verification

After running the stack, create a product and then fetch it:

1. Start services:

```bash
docker compose up --build
```

2. Create a product (example body):

```json
{
  "name": "Test Product",
  "price": 10.50,
  "inventory": 3
}
```

3. Fetch it:

```text
GET http://localhost:3001/products/<id>
```

The response includes `inventory` coming from the inventory service.

You can also check inventory directly:

```text
GET http://localhost:4000/inventory/<id>
```

---

## Notes

- If you call `GET http://localhost:3001/products/7` but product `id=7` does not exist, you should now get:
  - `404 { "error": "Product not found" }`
  rather than a 500.
- Also, the correct route is plural: `/products/...` (not `/product/...`).

