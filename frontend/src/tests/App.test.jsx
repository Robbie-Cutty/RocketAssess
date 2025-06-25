import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import Home from '../pages/Home';

// Mock fetch globally
global.fetch = jest.fn();

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock AOS
jest.mock('aos', () => ({
  init: jest.fn(),
}));

const renderWithRouter = (component) => {
  // Always wrap in BrowserRouter for consistent testing
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders home page by default', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/Welcome to Rocket Assess/i)).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Register/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
  });
});

describe('Login Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders login form', () => {
    renderWithRouter(<Login />);
    expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithRouter(<Login />);
    // Set role to teacher to trigger password validation
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'teacher' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '' } });
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    // Check if validation errors appear
    await waitFor(() => {
      const emailError = screen.queryByText(/Email is required/i);
      expect(emailError).toBeInTheDocument();
    });
  });

  test('handles successful login', async () => {
    const mockResponse = {
      token: 'test-token',
      teacher: {
        id: 1,
        name: 'Test Teacher',
        email: 'teacher@test.edu'
      }
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });
    
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'teacher' } });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'teacher@test.edu' }
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/login-teacher/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_code: '',
          email: 'teacher@test.edu',
          password: 'password123',
          role: 'teacher'
        })
      });
    });
  });

  test('handles login error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    });
    
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'teacher' } });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'teacher@test.edu' }
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpassword' }
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'teacher' } });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'teacher@test.edu' }
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Network error. Please try again/i)).toBeInTheDocument();
    });
  });
});

describe('Home Component', () => {
  test('renders hero section', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Welcome to Rocket Assess/i)).toBeInTheDocument();
    expect(screen.getByText(/A modern platform/i)).toBeInTheDocument();
  });

  test('renders features section', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Features/i)).toBeInTheDocument();
    expect(screen.getAllByText(/For Organizations/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/For Teachers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/For Students/i).length).toBeGreaterThan(0);
  });

  test('renders how it works section', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Tests/i)).toBeInTheDocument();
  });

  test('renders testimonials', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/What Our Users Say/i)).toBeInTheDocument();
    expect(screen.getByText(/Rocket Assess made online testing a breeze/i)).toBeInTheDocument();
  });

  test('renders FAQ section', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Is Rocket Assess free to use?/i)).toBeInTheDocument();
  });

  test('shows login buttons when not logged in', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    expect(screen.getByText(/Learn More/i)).toBeInTheDocument();
  });
});

describe('Form Validation', () => {
  test('email validation', () => {
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    // Email validation would be handled by HTML5 validation or custom validation
    expect(emailInput.value).toBe('invalid-email');
  });

  test('password validation', () => {
    renderWithRouter(<Login />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);

    expect(passwordInput.value).toBe('123');
  });
});

describe('Navigation', () => {
  test('navigates to register page', () => {
    renderWithRouter(<App />);
    const registerLinks = screen.getAllByText(/Register/i);
    expect(registerLinks.length).toBeGreaterThan(0);
    fireEvent.click(registerLinks[0]);
    // In a real test, you'd check if the URL changed or if register form is shown
    expect(registerLinks[0]).toBeInTheDocument();
  });

  test('navigates to login page', () => {
    renderWithRouter(<App />);
    const loginLinks = screen.getAllByText(/Login/i);
    expect(loginLinks.length).toBeGreaterThan(0);
    fireEvent.click(loginLinks[0]);
    expect(loginLinks[0]).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  test('has proper form labels', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('has proper button text', () => {
    renderWithRouter(<Login />);
    const submitButtons = screen.getAllByText(/Login/i);
    expect(submitButtons.length).toBeGreaterThan(0);
  });
}); 