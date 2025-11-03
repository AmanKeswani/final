const axios = require('axios');

const AUTH_URL = 'http://localhost:54322';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5NiwiaWF0IjoxNzYxMzk2MTM0fQ.6S8Na4ZHCHJHv3NxyeIdwwoKQnL7DaRgY2fUs-Ua6zE';

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

async function createAuthUser(user) {
  try {
    console.log(`\n🔐 Creating auth user: ${user.email}`);
    
    const response = await axios.post(`${AUTH_URL}/admin/users`, {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role
      }
    }, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      }
    });

    console.log(`✅ Successfully created auth user: ${user.email}`);
    console.log(`   User ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create auth user ${user.email}:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating auth users via Auth API...\n');

  for (const user of users) {
    await createAuthUser(user);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Auth user creation completed!');
}

main().catch(console.error);