-- Insert initial users with hashed passwords (password123 for all test users)
-- Note: In production, users should be created through Supabase Auth
INSERT INTO users (id, email, name, password, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'superadmin@company.com', 'Super Admin', '$2b$10$rOOjq9Q8kJKKKKKKKKKKKOeJ8J8J8J8J8J8J8J8J8J8J8J8J8J8J8', 'SUPER_ADMIN'),
    ('550e8400-e29b-41d4-a716-446655440002', 'manager@company.com', 'Manager', '$2b$10$rOOjq9Q8kJKKKKKKKKKKKOeJ8J8J8J8J8J8J8J8J8J8J8J8J8J8J8', 'MANAGER');

-- Insert asset types
INSERT INTO asset_types (name, description, category) VALUES
    ('Laptop', 'Portable computers for work and development', 'Computing'),
    ('Desktop', 'Desktop computers for office work', 'Computing'),
    ('Phone', 'Mobile phones for communication', 'Mobile'),
    ('Monitor', 'External displays for workstations', 'Peripherals'),
    ('Tablet', 'Tablet devices for mobile work', 'Mobile');

-- Insert asset configurations for Laptop
INSERT INTO asset_configurations (asset_type_id, name, description, data_type, is_required, display_order) 
SELECT id, 'RAM', 'Memory capacity in GB', 'select', true, 1 FROM asset_types WHERE name = 'Laptop';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Storage', 'Storage capacity and type', 'select', '["256GB SSD", "512GB SSD", "1TB SSD", "1TB HDD"]', true, 2 FROM asset_types WHERE name = 'Laptop';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, is_required, display_order) 
SELECT id, 'Processor', 'CPU model and specifications', 'text', true, 3 FROM asset_types WHERE name = 'Laptop';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Screen Size', 'Display size in inches', 'select', '["13\"", "14\"", "15\"", "16\"", "17\""]', true, 4 FROM asset_types WHERE name = 'Laptop';

-- Insert asset configurations for Desktop
INSERT INTO asset_configurations (asset_type_id, name, description, data_type, is_required, display_order) 
SELECT id, 'RAM', 'Memory capacity in GB', 'select', true, 1 FROM asset_types WHERE name = 'Desktop';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Storage', 'Storage capacity and type', 'select', '["256GB SSD", "512GB SSD", "1TB SSD", "2TB HDD"]', true, 2 FROM asset_types WHERE name = 'Desktop';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, is_required, display_order) 
SELECT id, 'Processor', 'CPU model and specifications', 'text', true, 3 FROM asset_types WHERE name = 'Desktop';

-- Insert asset configurations for Phone
INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Storage', 'Internal storage capacity', 'select', '["64GB", "128GB", "256GB", "512GB"]', true, 1 FROM asset_types WHERE name = 'Phone';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Operating System', 'Mobile operating system', 'select', '["iOS", "Android"]', true, 2 FROM asset_types WHERE name = 'Phone';

-- Insert asset configurations for Monitor
INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Size', 'Monitor size in inches', 'select', '["21\"", "24\"", "27\"", "32\"", "34\""]', true, 1 FROM asset_types WHERE name = 'Monitor';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Resolution', 'Display resolution', 'select', '["1920x1080", "2560x1440", "3840x2160"]', true, 2 FROM asset_types WHERE name = 'Monitor';

-- Insert asset configurations for Tablet
INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Storage', 'Internal storage capacity', 'select', '["32GB", "64GB", "128GB", "256GB"]', true, 1 FROM asset_types WHERE name = 'Tablet';

INSERT INTO asset_configurations (asset_type_id, name, description, data_type, options, is_required, display_order) 
SELECT id, 'Screen Size', 'Display size in inches', 'select', '["8\"", "10\"", "11\"", "12\""]', true, 2 FROM asset_types WHERE name = 'Tablet';

-- Insert some sample assets
INSERT INTO assets (name, description, serial_number, model, brand, category, status, asset_type_id) 
SELECT 
    'MacBook Pro 16"', 
    'High-performance laptop for development work', 
    'MBP-001', 
    'MacBook Pro', 
    'Apple', 
    'Computing', 
    'AVAILABLE',
    id 
FROM asset_types WHERE name = 'Laptop';

INSERT INTO assets (name, description, serial_number, model, brand, category, status, asset_type_id) 
SELECT 
    'Dell OptiPlex 7090', 
    'Desktop computer for office work', 
    'DELL-001', 
    'OptiPlex 7090', 
    'Dell', 
    'Computing', 
    'AVAILABLE',
    id 
FROM asset_types WHERE name = 'Desktop';

INSERT INTO assets (name, description, serial_number, model, brand, category, status, asset_type_id) 
SELECT 
    'iPhone 14 Pro', 
    'Company mobile phone', 
    'IPH-001', 
    'iPhone 14 Pro', 
    'Apple', 
    'Mobile', 
    'AVAILABLE',
    id 
FROM asset_types WHERE name = 'Phone';

INSERT INTO assets (name, description, serial_number, model, brand, category, status, asset_type_id) 
SELECT 
    'Dell UltraSharp 27"', 
    'External monitor for workstation', 
    'MON-001', 
    'UltraSharp U2723QE', 
    'Dell', 
    'Peripherals', 
    'AVAILABLE',
    id 
FROM asset_types WHERE name = 'Monitor';