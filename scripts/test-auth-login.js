const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test users
const testUsers = [
  {
    email: 'superadmin@company.com',
    password: 'SuperAdmin123!',
    expectedRole: 'SUPER_ADMIN'
  },
  {
    email: 'manager@company.com',
    password: 'Manager123!',
    expectedRole: 'MANAGER'
  }
];

async function testLogin() {
  console.log('🔐 Testing authentication for sample users...\n');

  for (const user of testUsers) {
    try {
      console.log(`Testing login for: ${user.email}`);
      
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.error(`❌ Login failed for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Login successful for ${user.email}`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   User Metadata:`, data.user.user_metadata);
        
        // Sign out after successful login
        await supabase.auth.signOut();
        console.log(`   Signed out successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception during login for ${user.email}:`, err.message);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Authentication testing completed!');
}

// Run the test
testLogin().catch(console.error);