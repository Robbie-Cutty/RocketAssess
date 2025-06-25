import React, { useState } from 'react';
import '../styles/globals.css';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../utils/axios';
import { validateRegistrationForm } from '../utils/validation';

const orgName = Cookies.get('org_name');
const teacherName = Cookies.get('teacher_name');
const isLoggedIn = !!(orgName || teacherName);

const initialState = {
  org_code: '',
  name: '',
  website: '',
  email: '',
  phone: '',
  city: '',
};

const Register = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const handleOrgRegister = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateRegistrationForm(form, 'organization');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // Registration endpoint, do NOT use api instance (no token yet)
      const response = await fetch('/api/register-organization/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.status === 201) {
        setSubmitted(true);
      } else {
        setServerError(data?.error || 'Registration failed.');
      }
    } catch {
      setServerError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-light">
        <div className="flex-1 flex items-center justify-center">
          <div className="card max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-3 text-success">Registration Successful!</h2>
            <p className="mb-4">Your organization has been registered. You can now log in or invite teachers and students.</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
            <div className="mt-4">
              {!isLoggedIn && <Link to="/" className="btn btn-outline">Back to Home</Link>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-light">
      <div className="flex-1 flex items-center justify-center">
        <form className="card max-w-md w-full pt-8 relative" onSubmit={handleOrgRegister} autoComplete="off">
          {!isLoggedIn && <Link to="/" className="btn btn-outline btn-sm absolute left-0 top-0">&larr; Back to Home</Link>}
          <Link to="/login" className="text-primary text-sm absolute right-0 top-0">Login</Link>
          <h2 className="card-header text-center text-primary">Organization Sign Up</h2>
          {serverError && <div className="alert alert-danger mb-3">{serverError}</div>}
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
          <div className="form-group">
            <label htmlFor="name">Organization Name *</label>
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
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={form.website}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.website && <div className="form-error">{errors.website}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.phone && <div className="form-error">{errors.phone}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.city && <div className="form-error">{errors.city}</div>}
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Registering...' : 'Register Organization'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
