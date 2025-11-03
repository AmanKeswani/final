-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('USER', 'MANAGER', 'SUPER_ADMIN');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE request_type AS ENUM ('NEW_ASSET', 'REPLACEMENT', 'COMPLAINT', 'MAINTENANCE');
CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED', 'LOST');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_types table
CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    serial_number VARCHAR(255) UNIQUE,
    model VARCHAR(255),
    brand VARCHAR(255),
    category VARCHAR(255) NOT NULL,
    status asset_status DEFAULT 'AVAILABLE',
    purchase_date DATE,
    warranty_expiry DATE,
    value DECIMAL(10,2),
    location VARCHAR(255),
    asset_type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_assignments table
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create asset_history table
CREATE TABLE asset_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type request_type NOT NULL,
    status request_status DEFAULT 'PENDING',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    device_type VARCHAR(255),
    preferences TEXT,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_configurations table
CREATE TABLE asset_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    options TEXT,
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_user_id ON asset_assignments(user_id);
CREATE INDEX idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX idx_asset_history_user_id ON asset_history(user_id);
CREATE INDEX idx_requests_requested_by ON requests(requested_by);
CREATE INDEX idx_requests_approved_by ON requests(approved_by);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_asset_configurations_asset_type_id ON asset_configurations(asset_type_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_types_updated_at BEFORE UPDATE ON asset_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_configurations_updated_at BEFORE UPDATE ON asset_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();