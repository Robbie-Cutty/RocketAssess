import React, { useState, useEffect } from 'react';
import '../styles/globals.css';
import { Link, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../utils/axios';
import { validateRegistrationForm } from '../utils/validation';

const orgName = Cookies.get('org_name');
const teacherName = Cookies.get('teacher_name');
const isLoggedIn = !!(orgName || teacherName);

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  org_code: '',
};

const TeacherRegister = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  useEffect(() => {
    const email = query.get('email');
    if (email) {
      setForm(f => ({ ...f, email }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateRegistrationForm(form, 'teacher');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/register-teacher/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          org_code: form.org_code,
        }),
      });
      const data = await response.json();
      if (response.status === 201) {
        setSubmitted(true);
        if (data.teacher && data.teacher.id) {
          Cookies.set('teacher_pk', data.teacher.id, { expires: 7 });
          localStorage.setItem('teacher_pk', data.teacher.id);
        }
        if (data.teacher && data.teacher.name) {
          Cookies.set('teacher_name', data.teacher.name, { expires: 7 });
          localStorage.setItem('teacher_name', data.teacher.name);
        }
      } else if (data && data.error) {
        setServerError(data.error);
      } else {
        setServerError('Registration failed.');
      }
    } catch (err) {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-3 text-success">Registration Successful!</h2>
          <p className="mb-4">Your teacher account has been created. You can now log in.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
          <div className="mt-4">
            {!isLoggedIn && <Link to="/" className="btn btn-outline">Back to Home</Link>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen">
      <form className="card max-w-md w-full" onSubmit={handleSubmit} autoComplete="off">
        <div className="flex justify-between mb-3">
          {!isLoggedIn && <Link to="/" className="btn btn-outline btn-sm">&larr; Back to Home</Link>}
          <Link to="/login" className="text-primary text-sm">Login</Link>
        </div>
        <h2 className="card-header text-center text-primary">Teacher Registration</h2>
        {serverError && <div className="alert alert-danger mb-3">{serverError}</div>}
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className={errors.name ? 'border-danger' : ''}
            required
            disabled={loading}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={errors.email ? 'border-danger' : ''}
            required
            disabled={!!query.get('email') || loading}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className={errors.password ? 'border-danger' : ''}
            required
            disabled={loading}
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'border-danger' : ''}
            required
            disabled={loading}
          />
          {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="org_code">Organization Code *</label>
          <input
            type="text"
            id="org_code"
            name="org_code"
            value={form.org_code}
            onChange={handleChange}
            className={errors.org_code ? 'border-danger' : ''}
            required
            disabled={loading}
          />
          {errors.org_code && <div className="form-error">{errors.org_code}</div>}
        </div>
        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
          {loading ? 'Registering...' : 'Register as Teacher'}
        </button>
      </form>
    </div>
  );
};

export default TeacherRegister; 