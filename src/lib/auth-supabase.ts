import { supabase } from './supabase';
import { Database } from './supabase';
import bcrypt from 'bcryptjs';
import { UserRole, RequestType, RequestStatus, AssetStatus, AuthUser } from './types';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(
  email: string, 
  password: string, 
  name?: string, 
  role: UserRole = 'USER'
): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      }
    }
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  // Create user in public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      password: hashedPassword,
      name,
      role,
    })
    .select()
    .single();

  if (userError) {
    // Clean up auth user if public user creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to create user profile: ${userError.message}`);
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  };
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return null;
  }

  // Get user profile from public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile from public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', id)
    .single();

  if (error || !userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
  
  return session;
}

export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    throw new Error(`Failed to refresh session: ${error.message}`);
  }
  
  return session;
}



// Helper function to get user role from session
export async function getUserRoleFromSession(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}