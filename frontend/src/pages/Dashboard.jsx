import '../styles/globals.css';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import InputField from '../components/InputField';
import Notification from '../components/Notification';
import Cookies from 'js-cookie';
import api from '../utils/axios';

const orgName = Cookies.get('org_name');
const teacherName = Cookies.get('teacher_name');
const isLoggedIn = !!(orgName || teacherName);

function parseEmails(input) {
  return input
    .split(/[,;\n]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

const Dashboard = () => {
  const [bulkInput, setBulkInput] = useState('');
  const [emails, setEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [orgCode, setOrgCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const code = Cookies.get('org_code');
    setOrgCode(code);
    if (!code) {
      setError('Organization code not found. Please log in again.');
      return;
    }
    const fetchTeachers = async () => {
      try {
        console.log('Fetching teachers for org_code:', code);
        const response = await api.get(`/api/teachers/?org_code=${code}`);
        if (response.status === 200) {
          const data = response.data;
          setTeachers(data);
        } else {
          setError('Failed to fetch teachers.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    };
    fetchTeachers();
  }, []);

  const handleBulkInputChange = (e) => {
    setBulkInput(e.target.value);
    setStatus('');
    setError('');
  };

  const handleParseEmails = () => {
    const parsed = parseEmails(bulkInput);
    const valid = parsed.filter(isValidEmail);
    const invalid = parsed.filter(e => !isValidEmail(e));
    setEmails([...emails, ...valid.filter(e => !emails.includes(e))]);
    setInvalidEmails(invalid);
    setBulkInput('');
  };

  const handleRemoveEmail = (email) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    if (emails.length === 0) {
      setError('Please add at least one valid email.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/invite-teachers/', { emails });
      const data = response.data;
      if (response.status === 200 && data.results) {
        const sent = data.results.filter(r => r.status === 'sent').map(r => r.email);
        const invalid = data.results.filter(r => r.status === 'invalid').map(r => r.email);
        const failed = data.results.filter(r => r.status === 'error').map(r => r.email);
        let msg = '';
        if (sent.length) msg += `Invitations sent: ${sent.join(', ')}. `;
        if (invalid.length) msg += `Invalid emails: ${invalid.join(', ')}. `;
        if (failed.length) msg += `Failed to send: ${failed.join(', ')}.`;
        setStatus(msg.trim());
        setEmails([]);
        setInvalidEmails([]);
      } else {
        setError('Failed to send invitations.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f8fa' }}>
      <div style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 18, maxWidth: 420, width: '100%', padding: 32, textAlign: 'center', margin: 16 }}>
        <div style={{ marginBottom: 18, textAlign: 'left' }}>
          {!isLoggedIn && <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>&larr; Back to Home</Link>}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#2563eb' }}>Organization Dashboard</h2>
        <p style={{ marginBottom: 18, color: '#444', fontSize: 16 }}>Welcome! Invite teachers to your organization below.</p>
        <form onSubmit={handleInvite} style={{ marginBottom: 24 }}>
          <label htmlFor="bulk-emails" style={{ display: 'block', textAlign: 'left', marginBottom: 7, fontWeight: 600, fontSize: 15 }}>Teacher Emails (comma, semicolon, or newline separated)</label>
          <textarea
            id="bulk-emails"
            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: 10, width: '100%', marginBottom: 10, fontSize: 15, resize: 'vertical', minHeight: 38 }}
            placeholder="Enter one or more emails..."
            value={bulkInput}
            onChange={handleBulkInputChange}
            rows={2}
            disabled={loading}
          />
          <button type="button" style={{ border: '1px solid #2563eb', color: '#2563eb', background: '#f3f6fd', borderRadius: 6, padding: '6px 14px', fontSize: 14, fontWeight: 500, marginBottom: 10, cursor: loading || !bulkInput.trim() ? 'not-allowed' : 'pointer', marginRight: 8 }} onClick={handleParseEmails} disabled={loading || !bulkInput.trim()}>
            Add Emails
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {emails.map(email => (
              <span key={email} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 12, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }} onClick={() => handleRemoveEmail(email)} title="Remove">{email} &times;</span>
            ))}
          </div>
          {invalidEmails.length > 0 && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 7, padding: '7px 12px', marginBottom: 10, fontSize: 14 }}>
              Invalid emails: {invalidEmails.join(', ')}
            </div>
          )}
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, width: '100%', padding: '10px 0', fontSize: 16, fontWeight: 600, cursor: loading || emails.length === 0 ? 'not-allowed' : 'pointer', marginTop: 2, boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }} disabled={loading || emails.length === 0}>
            {loading ? 'Sending...' : 'Invite Teachers'}
          </button>
        </form>
        <div style={{ minHeight: 24, marginBottom: 8 }}>
          <Notification type={status ? 'success' : 'danger'} message={status || error} />
        </div>
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, color: '#1e293b' }}>Teachers</h3>
          <input
            type="text"
            placeholder="Search teachers by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: 10, width: '100%', marginBottom: 10, fontSize: 15 }}
          />
          {teachers.length > 0 ? (
            <ul style={{ textAlign: 'left', paddingLeft: 22, margin: 0, fontSize: 15, color: '#222' }}>
              {filteredTeachers.map(teacher => (
                <li key={teacher.id} style={{ marginBottom: 4 }}>{teacher.name} <span style={{ color: '#64748b', fontSize: 14 }}>({teacher.email})</span></li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>No teachers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
