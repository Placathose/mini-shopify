-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert 5 sample products
INSERT INTO products (name, description, price) VALUES
('T-shirt', 'Basic cotton t-shirt', 19.99),
('Hoodie', 'Warm hoodie with logo', 39.99),
('Jeans', 'Blue denim jeans', 49.99),
('Sneakers', 'Comfortable running sneakers', 69.99),
('Cap', 'Adjustable baseball cap', 14.99);

-- Insert inventory for the 5 products
INSERT INTO inventory (product_id, quantity) VALUES
(1, 100),
(2, 50),
(3, 75),
(4, 30),
(5, 200);