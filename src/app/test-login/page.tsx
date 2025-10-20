'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const router = useRouter();

  const testLogin = async () => {
    setLoading(true);
    setResult('Starting login test...');
    
    try {
      console.log('Test: Making login request');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Test: Login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test: Login successful, data:', data);
        setResult(`Login successful! User: ${data.user?.email}, Role: ${data.user?.role}`);
        
        // Test the /api/auth/me endpoint
        setTimeout(async () => {
          console.log('Test: Testing /api/auth/me endpoint');
          const meResponse = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          
          console.log('Test: /api/auth/me response status:', meResponse.status);
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('Test: /api/auth/me data:', meData);
            setResult(prev => prev + `\n\n/api/auth/me test successful! User: ${meData.user?.email}`);
            
            // Now test redirect
            setTimeout(() => {
              console.log('Test: Attempting redirect to dashboard');
              setResult(prev => prev + '\n\nAttempting redirect to dashboard...');
              router.push('/user/dashboard');
            }, 1000);
          } else {
            const errorText = await meResponse.text();
            console.log('Test: /api/auth/me error:', errorText);
            setResult(prev => prev + `\n\n/api/auth/me failed: ${errorText}`);
          }
        }, 500);
      } else {
        const errorData = await response.json();
        console.log('Test: Login failed:', errorData);
        setResult(`Login failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Test: Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Flow Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login Flow'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Test Results:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}