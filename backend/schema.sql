-- Bases Table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) CHECK (
        role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')
    ),
    base_id INT REFERENCES bases(id) ON DELETE SET NULL
);

-- Equipment Categories / Types
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL
);

-- Transfers Table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    source_base_id INT REFERENCES bases(id),
    destination_base_id INT REFERENCES bases(id),
    equipment_type_id INT REFERENCES equipment_types(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initiated_by INT REFERENCES users(id)
);

-- System Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
