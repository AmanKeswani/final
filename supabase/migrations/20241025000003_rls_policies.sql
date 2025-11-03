-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('SUPER_ADMIN', 'MANAGER') FROM users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Assets table policies
CREATE POLICY "Everyone can view assets" ON assets
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage assets" ON assets
    FOR ALL USING (is_admin(auth.uid()));

-- Asset types table policies
CREATE POLICY "Everyone can view asset types" ON asset_types
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage asset types" ON asset_types
    FOR ALL USING (is_admin(auth.uid()));

-- Asset assignments table policies
CREATE POLICY "Users can view their own assignments" ON asset_assignments
    FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage assignments" ON asset_assignments
    FOR ALL USING (is_admin(auth.uid()));

-- Asset history table policies
CREATE POLICY "Users can view history of their assets" ON asset_history
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM asset_assignments aa 
            WHERE aa.asset_id = asset_history.asset_id 
            AND aa.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage asset history" ON asset_history
    FOR ALL USING (is_admin(auth.uid()));

-- Requests table policies
CREATE POLICY "Users can view their own requests" ON requests
    FOR SELECT USING (auth.uid() = requested_by OR is_admin(auth.uid()));

CREATE POLICY "Users can create requests" ON requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own pending requests" ON requests
    FOR UPDATE USING (
        auth.uid() = requested_by AND status = 'PENDING'
    );

CREATE POLICY "Admins can manage all requests" ON requests
    FOR ALL USING (is_admin(auth.uid()));

-- Asset configurations table policies
CREATE POLICY "Everyone can view asset configurations" ON asset_configurations
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage asset configurations" ON asset_configurations
    FOR ALL USING (is_admin(auth.uid()));

-- Posts table policies
CREATE POLICY "Everyone can view published posts" ON posts
    FOR SELECT USING (published = true OR auth.uid() = author_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON posts
    FOR ALL USING (is_admin(auth.uid()));

-- Create a function to sync auth.users with our users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'USER');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();