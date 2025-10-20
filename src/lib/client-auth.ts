import { AuthUser } from './auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('client-auth: Making request to /api/auth/me');
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('client-auth: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('client-auth: Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('client-auth: Success response data:', data);
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}