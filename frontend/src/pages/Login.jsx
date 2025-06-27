import React, { useState } from 'react';
import '../styles/globals.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { validateLoginForm } from '../utils/validation';
import sessionManager from '../utils/sessionManager';

const Login = () => {
  const [form, setForm] = useState({
    role: 'organization',
    org_code: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from a protected route
  const fromProtectedRoute = location.state?.from;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};
      switch (form.role) {
        case 'organization':
          endpoint = '/api/login-organization/';
          payload = {
            org_code: form.org_code,
            email: form.email,
            password: form.password,
          };
          break;
        case 'teacher':
          endpoint = '/api/login-teacher/';
          payload = {
            email: form.email,
            password: form.password,
          };
          break;
        case 'student':
          endpoint = '/api/login-student/';
          payload = {
            email: form.email,
            password: form.password,
          };
          break;
        default:
          setServerError('Invalid role selected.');
          setLoading(false);
          return;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.status === 200) {
        // Clear all user-related cookies before setting new ones
        Cookies.remove('token');
        Cookies.remove('org_code');
        Cookies.remove('org_name');
        Cookies.remove('teacher_name');
        Cookies.remove('teacher_id');
        Cookies.remove('user_email');
        
        if (form.role === 'teacher') {
          if (data.teacher && data.teacher.name) {
            Cookies.set('teacher_name', data.teacher.name, { expires: 7 });
            localStorage.setItem('teacher_name', data.teacher.name);
          }
          if (data.teacher && data.teacher.email) {
            Cookies.set('user_email', data.teacher.email, { expires: 7 });
          }
          if (data.teacher && data.teacher.teacher_id) {
            Cookies.set('teacher_id', data.teacher.teacher_id, { expires: 7 });
          }
          if (data.teacher && data.teacher.id) {
            Cookies.set('teacher_pk', data.teacher.id, { expires: 7 });
            localStorage.setItem('teacher_pk', data.teacher.id);
          }
          // Set session for teacher
          sessionManager.setLoggedIn('teacher', data.teacher);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          // Use setTimeout to ensure all data is set before navigation
          setTimeout(() => {
            navigate('/teacher-dashboard');
          }, 100);
        } else if (form.role === 'organization') {
          if (data.org && data.org.name) {
            Cookies.set('org_name', data.org.name, { expires: 7 });
          }
          if (data.org && data.org.org_code) {
            Cookies.set('org_code', data.org.org_code, { expires: 7 });
          }
          if (data.org && data.org.email) {
            Cookies.set('user_email', data.org.email, { expires: 7 });
          }
          // Set session for organization
          sessionManager.setLoggedIn('organization', data.org);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          navigate('/dashboard');
        } else if (form.role === 'student') {
          if (data.student && data.student.name) {
            localStorage.setItem('student_name', data.student.name);
          }
          if (data.student && data.student.email) {
            localStorage.setItem('student_email', data.student.email);
          }
          // Set session for student
          sessionManager.setLoggedIn('student', data.student);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          // Use setTimeout to ensure all data is set before navigation
          setTimeout(() => {
            navigate('/student-dashboard');
          }, 100);
        }
      } else if (data && data.error) {
        setServerError(data.error);
      } else {
        setServerError('Login failed.');
      }
    } catch (err) {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen">
      <form className="card max-w-md w-full pt-8 relative" onSubmit={handleSubmit} autoComplete="off">
        <Link to="/" className="btn btn-outline btn-sm absolute left-0 top-0">&larr; Back to Home</Link>
        <Link to="/register" className="text-primary text-sm absolute right-0 top-0">Register</Link>
        <h2 className="card-header text-center text-primary">Login</h2>
        
        {fromProtectedRoute && (
          <div className="alert alert-info mb-3">
            Please log in to access the requested page.
          </div>
        )}
        
        {serverError && <div className="alert alert-danger mb-3">{serverError}</div>}
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className={errors.role ? 'border-danger' : ''}
            disabled={loading}
          >
            <option value="organization">Organization</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          {errors.role && <div className="form-error">{errors.role}</div>}
        </div>
        {form.role === 'organization' && (
          <div className="form-group">
            <label htmlFor="org_code">Organization Code</label>
            <input
              type="text"
              id="org_code"
              name="org_code"
              value={form.org_code}
              onChange={handleChange}
              className={errors.org_code ? 'border-danger' : ''}
              disabled={loading}
            />
            {errors.org_code && <div className="form-error">{errors.org_code}</div>}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={errors.email ? 'border-danger' : ''}
            disabled={loading}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className={errors.password ? 'border-danger' : ''}
            disabled={loading}
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>
        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login; 