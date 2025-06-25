import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudentRegister.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const StudentRegister = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [orgLookupLoading, setOrgLookupLoading] = useState(false);
  const [orgLookupError, setOrgLookupError] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    name: '',
    email: '',
    password: '',
    gender: '',
    grade: '',
    org_id: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const orgIdFromUrl = query.get('org_id');
    const orgCode = query.get('org_code');
    const emailFromUrl = query.get('email');

    if (orgIdFromUrl) {
      setForm(f => ({ ...f, org_id: orgIdFromUrl }));
    } else if (orgCode) {
      setOrgLookupLoading(true);
      api.get(`/api/organizations/?org_code=${orgCode}`)
        .then(res => {
          if (res.data && res.data.id) {
            setForm(f => ({ ...f, org_id: res.data.id }));
            setOrgLookupError(false);
          } else {
            setOrgLookupError(true);
            setMessage('Organization not found. Please check your invite link.');
          }
        })
        .catch(() => {
          setOrgLookupError(true);
          setMessage('Organization not found. Please check your invite link.');
        })
        .finally(() => setOrgLookupLoading(false));
    }

    // Set email from URL if present
    if (emailFromUrl) {
      setForm(f => ({ ...f, email: emailFromUrl }));
    }
    // Only run once on mount
    // eslint-disable-next-line
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.org_id) {
      setMessage('Organization ID is missing.');
      return;
    }
    try {
      await api.post('/api/students/register/', form);
      setMessage('Registration successful!');
      localStorage.setItem('student_name', form.name);
      localStorage.setItem('student_email', form.email);
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 1500);
    } catch (err) {
      setMessage('Registration failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="student-register-container">
      <form className="student-register-form" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>
        <div className="form-row">
          <input name="student_id" placeholder="Student ID" value={form.student_id} onChange={handleChange} required />
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required readOnly={!!form.email} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input name="grade" placeholder="Grade" value={form.grade} onChange={handleChange} required />
        </div>
        <input type="hidden" name="org_id" value={form.org_id} />
        <div className="form-row">
          <button type="submit" disabled={orgLookupLoading || orgLookupError}>Register</button>
        </div>
        {orgLookupLoading && <div className="form-message">Looking up organization...</div>}
        {message && <div className="form-message">{message}</div>}
      </form>
    </div>
  );
};

export default StudentRegister; 