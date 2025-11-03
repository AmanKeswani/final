const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5NiwiaWF0IjoxNzYxMzk2MTM0fQ.6S8Na4ZHCHJHv3NxyeIdwwoKQnL7DaRgY2fUs-Ua6zE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: 'superadmin@company.com',
    password: 'SuperAdmin123!',
    role: 'SUPER_ADMIN',
    name: 'Super Admin'
  },
  {
    email: 'manager@company.com',
    password: 'Manager123!',
    role: 'MANAGER',
    name: 'Manager User'
  }
];

async function createUser(user) {
  try {
    console.log(`\n🔐 Creating user: ${user.email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          role: user.role
        }
      }
    });

    if (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error);
      return null;
    }

    console.log(`✅ Successfully created user: ${user.email}`);
    console.log(`   User ID: ${data.user?.id}`);
    return data.user;
  } catch (error) {
    console.error(`❌ Error creating user ${user.email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating auth users via Supabase signup...\n');

  for (const user of users) {
    await createUser(user);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 User creation completed!');
}

main().catch(console.error);