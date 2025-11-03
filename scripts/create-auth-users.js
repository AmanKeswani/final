const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample users to create in auth
const users = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'superadmin@company.com',
    password: 'SuperAdmin123!',
    user_metadata: {
      name: 'Super Admin',
      role: 'SUPER_ADMIN'
    },
    email_confirm: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@company.com',
    password: 'Manager123!',
    user_metadata: {
      name: 'Manager',
      role: 'MANAGER'
    },
    email_confirm: true
  }
];

async function createAuthUsers() {
  console.log('🚀 Creating auth users in Supabase...\n');

  for (const userData of users) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: userData.email_confirm
      });

      if (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      } else {
        console.log(`✅ Successfully created ${userData.email} with ID: ${data.user.id}`);
      }
    } catch (err) {
      console.error(`❌ Exception creating ${userData.email}:`, err.message);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Auth user creation process completed!');
}

// Run the script
createAuthUsers().catch(console.error);