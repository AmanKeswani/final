import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          password: string;
          role: 'USER' | 'MANAGER' | 'SUPER_ADMIN';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          password: string;
          role?: 'USER' | 'MANAGER' | 'SUPER_ADMIN';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          password?: string;
          role?: 'USER' | 'MANAGER' | 'SUPER_ADMIN';
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          serial_number: string | null;
          model: string | null;
          brand: string | null;
          category: string;
          status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
          purchase_date: string | null;
          warranty_expiry: string | null;
          value: number | null;
          location: string | null;
          asset_type_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          serial_number?: string | null;
          model?: string | null;
          brand?: string | null;
          category: string;
          status?: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
          purchase_date?: string | null;
          warranty_expiry?: string | null;
          value?: number | null;
          location?: string | null;
          asset_type_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          serial_number?: string | null;
          model?: string | null;
          brand?: string | null;
          category?: string;
          status?: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
          purchase_date?: string | null;
          warranty_expiry?: string | null;
          value?: number | null;
          location?: string | null;
          asset_type_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      asset_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      asset_assignments: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string;
          assigned_at: string;
          returned_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          asset_id: string;
          user_id: string;
          assigned_at?: string;
          returned_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          asset_id?: string;
          user_id?: string;
          assigned_at?: string;
          returned_at?: string | null;
          notes?: string | null;
        };
      };
      asset_history: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string | null;
          action: string;
          details: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          user_id?: string | null;
          action: string;
          details?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          user_id?: string | null;
          action?: string;
          details?: string | null;
          timestamp?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          type: 'NEW_ASSET' | 'REPLACEMENT' | 'COMPLAINT' | 'MAINTENANCE';
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          title: string;
          description: string;
          priority: string;
          device_type: string | null;
          preferences: string | null;
          requested_by: string;
          approved_by: string | null;
          asset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'NEW_ASSET' | 'REPLACEMENT' | 'COMPLAINT' | 'MAINTENANCE';
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          title: string;
          description: string;
          priority?: string;
          device_type?: string | null;
          preferences?: string | null;
          requested_by: string;
          approved_by?: string | null;
          asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'NEW_ASSET' | 'REPLACEMENT' | 'COMPLAINT' | 'MAINTENANCE';
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          title?: string;
          description?: string;
          priority?: string;
          device_type?: string | null;
          preferences?: string | null;
          requested_by?: string;
          approved_by?: string | null;
          asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      asset_configurations: {
        Row: {
          id: string;
          asset_type_id: string;
          name: string;
          description: string | null;
          data_type: string;
          options: string | null;
          is_required: boolean;
          default_value: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_type_id: string;
          name: string;
          description?: string | null;
          data_type: string;
          options?: string | null;
          is_required?: boolean;
          default_value?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_type_id?: string;
          name?: string;
          description?: string | null;
          data_type?: string;
          options?: string | null;
          is_required?: boolean;
          default_value?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          published: boolean;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          published?: boolean;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          published?: boolean;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: 'USER' | 'MANAGER' | 'SUPER_ADMIN';
      request_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      request_type: 'NEW_ASSET' | 'REPLACEMENT' | 'COMPLAINT' | 'MAINTENANCE';
      asset_status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
    };
    CompositeTypes: {};
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];