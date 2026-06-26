-- Esquema inicial: Sistema de Objetos Perdidos

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(9),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    icon VARCHAR(40) NOT NULL DEFAULT 'tag'
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(12) NOT NULL CHECK (type IN ('perdido', 'encontrado')),
    status VARCHAR(12) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'recuperado')),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(160) NOT NULL,
    item_date DATE NOT NULL,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(9),
    contact_email VARCHAR(160),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_item ON comments (item_id);

-- Tabla de sesiones usada por connect-pg-simple
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

CREATE INDEX IF NOT EXISTS idx_items_type ON items (type);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);

INSERT INTO categories (name, icon) VALUES
    ('Electrónica', 'cpu-chip'),
    ('Documentos e identificaciones', 'identification'),
    ('Llaves', 'key'),
    ('Ropa y accesorios', 'shopping-bag'),
    ('Mascotas', 'heart'),
    ('Billeteras y bolsos', 'briefcase'),
    ('Joyas', 'sparkles'),
    ('Otros', 'tag')
ON CONFLICT (name) DO NOTHING;
