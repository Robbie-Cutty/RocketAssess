import React, { useState } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/axios';

function parseEmails(input) {
  return input
    .split(/[,;\n]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

const InviteStudentsPage = () => {
  const teacherId = Cookies.get('teacher_pk');
  const [bulkInput, setBulkInput] = useState('');
  const [emails, setEmails] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteResults, setInviteResults] = useState([]);

  const handleBulkInputChange = (e) => {
    setBulkInput(e.target.value);
    setStatus('');
    setError('');
  };

  const handleParseEmails = () => {
    setEmails(parseEmails(bulkInput));
    setStatus('');
    setError('');
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    setInviteResults([]);
    setLoading(true);
    try {
      const res = await api.post('/api/invite-students/', { emails, teacher_id: teacherId });
      const data = res.data;
      if (res.status === 200) {
        setStatus('Invitations processed!');
        setBulkInput('');
        setEmails([]);
        setInviteResults(data.results || []);
      } else {
        setError(data?.error || 'Failed to send invites.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, width: '95vw', margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 24 }}>Invite Students</h2>
      <div style={{ marginBottom: 18 }}>Send invitations to students by email. They will receive a registration link.</div>
      <form onSubmit={handleInvite} style={{ marginTop: 32, marginBottom: 12 }}>
        <label htmlFor="bulk-emails" style={{ display: 'block', textAlign: 'left', marginBottom: 7, fontWeight: 600, fontSize: 15 }}>Student Emails (comma, semicolon, or newline separated)</label>
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
            <span key={email} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 12, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }} onClick={() => setEmails(emails.filter(e => e !== email))} title="Remove">{email} &times;</span>
          ))}
        </div>
        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, width: '100%', padding: '10px 0', fontSize: 16, fontWeight: 600, cursor: loading || emails.length === 0 ? 'not-allowed' : 'pointer', marginTop: 2, boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }} disabled={loading || emails.length === 0}>
          {loading ? 'Sending...' : 'Invite Students'}
        </button>
      </form>
      <div style={{ minHeight: 24, marginBottom: 8 }}>
        {status && <div style={{ color: '#22c55e', fontWeight: 500 }}>{status}</div>}
        {error && <div style={{ color: '#dc2626', fontWeight: 500 }}>{error}</div>}
      </div>
      {/* Show invite results */}
      {inviteResults.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Invite Results:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {inviteResults.map(r => (
              <li key={r.email} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{r.email}:</span> {' '}
                {r.status === 'sent' && <span style={{ color: '#22c55e' }}>Invitation sent</span>}
                {r.status === 'already_invited' && <span style={{ color: '#f59e42' }}>Already invited</span>}
                {r.status === 'invalid' && <span style={{ color: '#dc2626' }}>Invalid email</span>}
                {r.status === 'error' && <span style={{ color: '#dc2626' }}>Error sending</span>}
                {r.status === 'registered' && <span style={{ color: '#2563eb' }}>Account registered</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <a href="/teacher-dashboard" style={{
          display: 'inline-block',
          padding: '10px 28px',
          borderRadius: 8,
          background: '#2563eb',
          color: '#fff',
          fontWeight: 600,
          fontSize: 17,
          textDecoration: 'none',
          boxShadow: '0 2px 8px #0001',
          border: 'none',
          cursor: 'pointer'
        }}>Back to Home</a>
      </div>
    </div>
  );
};

export default InviteStudentsPage; 