/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignupPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

const mockPush = jest.fn();
const mockRefresh = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  });
  jest.clearAllMocks();
});

describe('SignupPage', () => {
  it('renders signup form correctly', () => {
    render(<SignupPage />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Join us to manage your company assets')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation error for password mismatch', async () => {
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'differentpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(fetch).not.toHaveBeenCalled();
  });

  it('toggles password visibility for both password fields', () => {
    render(<SignupPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // Eye icon buttons
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    // Toggle first password field
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Toggle second password field
    fireEvent.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    
    // Toggle back
    fireEvent.click(toggleButtons[0]);
    fireEvent.click(toggleButtons[1]);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('handles successful signup for USER role', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: {
          id: '1',
          email: 'newuser@test.com',
          name: 'New User',
          role: 'USER',
        },
      }),
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'newuser@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'newuser@test.com', 
          password: 'password123', 
          name: 'New User' 
        }),
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Account created successfully! Redirecting to dashboard...')).toBeInTheDocument();
    });
  });

  it('handles successful signup for MANAGER role', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: {
          id: '2',
          email: 'manager@test.com',
          name: 'New Manager',
          role: 'MANAGER',
        },
      }),
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New Manager' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'manager@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Account created successfully! Redirecting to dashboard...')).toBeInTheDocument();
    });
    
    // Wait for redirect timeout
    await waitFor(() => {
      expect(window.location.href).toBe('/manager/dashboard');
    }, { timeout: 3000 });
  });

  it('handles signup failure', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Email already exists',
      }),
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'existing@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('shows loading state during signup', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: { id: '1', email: 'user@test.com', name: 'Test User', role: 'USER' },
      }),
    };
    
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );
    
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('validates required fields', async () => {
    render(<SignupPage />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission
    expect(fetch).not.toHaveBeenCalled();
  });
});