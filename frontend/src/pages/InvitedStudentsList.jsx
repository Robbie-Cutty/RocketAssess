import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/axios';

const InvitedStudentsList = () => {
  const teacherId = Cookies.get('teacher_pk');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitedStudents = () => {
    if (teacherId) {
      setLoading(true);
      api.get(`/api/invited-students/?teacher_id=${teacherId}`)
        .then(res => {
          setStudents(res.data.students || []);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchInvitedStudents();
    // eslint-disable-next-line
  }, [teacherId]);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 24 }}>Invited Students</h2>
      <button onClick={fetchInvitedStudents} disabled={loading} style={{ marginBottom: 18, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f6fd' }}>
            <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Invited At</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.email}>
              <td style={{ padding: 10 }}>{s.email}</td>
              <td style={{ padding: 10 }}>{s.name || '-'}</td>
              <td style={{ padding: 10 }}>
                {s.registered ? <span style={{ color: '#22c55e', fontWeight: 500 }}>Registered</span> : <span style={{ color: '#f59e42', fontWeight: 500 }}>Invited</span>}
              </td>
              <td style={{ padding: 10 }}>{new Date(s.invited_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvitedStudentsList; 