import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const TestResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/test-attendance/?test_id=${testId}`),
      api.get(`/api/test-submissions/?test_id=${testId}`)
    ])
      .then(async ([attendanceRes, submissionsRes]) => {
        const attendanceData = attendanceRes.data;
        const submissionsData = submissionsRes.data;
        setAttendance(attendanceData.attendance || []);
        setSubmissions(submissionsData.submissions || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch test results.');
        setLoading(false);
      });
  }, [testId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center' }}>{error}</div>;

  // Attendance summary
  const submittedEmails = new Set(submissions.map(s => s.student_email));
  const attended = attendance.filter(a => a.submitted).length;
  const total = attendance.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light">
      <div className="card max-w-3xl w-full" style={{ margin: '40px auto', padding: 32 }}>
        <h2 className="text-2xl font-bold mb-2 text-primary">Test Results</h2>
        <div style={{ marginBottom: 18, fontSize: 17 }}>
          <b>Attendance:</b> {attended} / {total} students submitted
        </div>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>Ranking</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 8, borderRadius: 6 }}>Rank</th>
                <th style={{ padding: 8, borderRadius: 6 }}>Name/Email</th>
                <th style={{ padding: 8, borderRadius: 6 }}>Score</th>
                <th style={{ padding: 8, borderRadius: 6 }}>Time in Test</th>
                <th style={{ padding: 8, borderRadius: 6 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, idx) => (
                <tr key={s.submission_id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: 8 }}>{s.student_name || s.student_email}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{s.score.toFixed(1)}%</td>
                  <td style={{ padding: 8, textAlign: 'center', whiteSpace: 'pre-line', fontSize: 14 }}>
                    <div><b>Entered:</b> {s.entered_at ? new Date(s.entered_at).toLocaleString() : '-'}</div>
                    <div><b>End:</b> {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '-'}</div>
                    <div><b>Duration:</b> {s.duration ? Math.round(s.duration / 60) + ' min' : '-'}</div>
                  </td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => navigate(`/review/${s.submission_id}`, { state: { fromResults: true, testId, scheduled_start: s.scheduled_start, scheduled_end: s.scheduled_end, scheduled_duration: s.scheduled_duration } })}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>Attendance</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 10, borderRadius: 6, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 10, borderRadius: 6, textAlign: 'left' }}>Email</th>
                <th style={{ padding: 10, borderRadius: 6, textAlign: 'center' }}>Submitted?</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => (
                <tr key={a.student_email} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: 10, minWidth: 120 }}>{a.student_name || <span style={{ color: '#64748b' }}>-</span>}</td>
                  <td style={{ padding: 10, minWidth: 200 }}>{a.student_email}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {a.submitted ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Yes</span> : <span style={{ color: '#dc2626', fontWeight: 600 }}>No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/teacher-dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default TestResults; 