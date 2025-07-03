import React, { useState } from 'react';
import '../styles/globals.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { validateLoginForm } from '../utils/validation';
import sessionManager from '../utils/sessionManager';
import api from '../utils/axios';

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
    setErrors({});
    
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
            org_code: form.org_code.trim(),
            email: form.email.trim(),
            password: form.password,
          };
          break;
        case 'teacher':
          endpoint = '/api/login-teacher/';
          payload = {
            email: form.email.trim(),
            password: form.password,
          };
          break;
        case 'student':
          endpoint = '/api/login-student/';
          payload = {
            email: form.email.trim(),
            password: form.password,
          };
          break;
        default:
          setServerError('Invalid role selected.');
          setLoading(false);
          return;
      }
      
      const response = await api.post(endpoint, payload);
      
      if (response.status === 200 && response.data) {
        // Clear all user-related cookies before setting new ones
        Cookies.remove('token');
        Cookies.remove('org_code');
        Cookies.remove('org_name');
        Cookies.remove('teacher_name');
        Cookies.remove('teacher_id');
        Cookies.remove('user_email');
        
        if (form.role === 'teacher' && response.data.teacher) {
          const teacher = response.data.teacher;
          if (teacher.name) {
            Cookies.set('teacher_name', teacher.name, { expires: 7 });
            localStorage.setItem('teacher_name', teacher.name);
          }
          if (teacher.email) {
            Cookies.set('user_email', teacher.email, { expires: 7 });
          }
          if (teacher.teacher_id) {
            Cookies.set('teacher_id', teacher.teacher_id, { expires: 7 });
          }
          if (teacher.id) {
            Cookies.set('teacher_pk', teacher.id, { expires: 7 });
            localStorage.setItem('teacher_pk', teacher.id);
          }
          // Set session for teacher
          sessionManager.setLoggedIn('teacher', teacher);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          // Force a full page reload to ensure all state is fresh
          setTimeout(() => {
            window.location.href = '/teacher-dashboard';
          }, 100);
        } else if (form.role === 'organization' && response.data.org) {
          const org = response.data.org;
          if (org.name) {
            Cookies.set('org_name', org.name, { expires: 7 });
          }
          if (org.org_code) {
            Cookies.set('org_code', org.org_code, { expires: 7 });
          }
          if (org.email) {
            Cookies.set('user_email', org.email, { expires: 7 });
          }
          // Set session for organization
          sessionManager.setLoggedIn('organization', org);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          // Force a full page reload to ensure all state is fresh
          window.location.href = '/dashboard';
        } else if (form.role === 'student' && response.data.student) {
          const student = response.data.student;
          if (student.name) {
            localStorage.setItem('student_name', student.name);
          }
          if (student.email) {
            localStorage.setItem('student_email', student.email);
          }
          // Set session for student
          sessionManager.setLoggedIn('student', student);
          
          // Dispatch custom event to notify Header of auth change
          window.dispatchEvent(new Event('authChange'));
          
          // Force a full page reload to ensure all state is fresh
          setTimeout(() => {
            window.location.href = '/student-dashboard';
          }, 100);
        } else {
          setServerError('Invalid response from server.');
        }
      } else if (response.data && response.data.error) {
        setServerError(response.data.error);
      } else {
        setServerError('Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #0002',
        padding: '40px 32px 32px 32px',
        maxWidth: 420,
        width: '100%',
        margin: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div className="login-header" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link to="/" className="btn btn-outline">&larr; Back to Home</Link>
          <Link to="/register" className="login-register-link">Register</Link>
        </div>
        <h2 className="login-title" style={{ marginBottom: 24, fontWeight: 800, color: '#2563eb', fontSize: 28 }}>Login</h2>
        <form onSubmit={handleSubmit} className="login-form" style={{ width: '100%' }}>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <option value="organization">Organization</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            {errors.role && <div className="form-error">{errors.role}</div>}
          </div>

          {form.role === 'organization' ? (
            <>
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
                  style={{ width: '100%' }}
                />
                {errors.org_code && <div className="form-error">{errors.org_code}</div>}
              </div>
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
                  style={{ width: '100%' }}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
            </>
          ) : (
            <>
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
                  style={{ width: '100%' }}
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
                  style={{ width: '100%' }}
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 10, width: '100%', fontSize: 17, fontWeight: 700, borderRadius: 8, padding: '12px 0' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {serverError && <div className="form-error" style={{ marginTop: 10 }}>{serverError}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login; 