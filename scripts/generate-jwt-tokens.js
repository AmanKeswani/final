const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

// Generate anon key
const anonPayload = {
  iss: 'supabase-demo',
  role: 'anon',
  exp: 1983812996 // Far future expiry
};

// Generate service role key
const serviceRolePayload = {
  iss: 'supabase-demo',
  role: 'service_role',
  exp: 1983812996 // Far future expiry
};

const anonKey = jwt.sign(anonPayload, JWT_SECRET);
const serviceRoleKey = jwt.sign(serviceRolePayload, JWT_SECRET);

console.log('🔑 Generated JWT Tokens:');
console.log('');
console.log('ANON KEY:');
console.log(anonKey);
console.log('');
console.log('SERVICE ROLE KEY:');
console.log(serviceRoleKey);
console.log('');
console.log('📝 Update your .env.local file with these tokens:');
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey}"`);
console.log(`SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"`);