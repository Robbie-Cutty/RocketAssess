import React, { useState, useEffect } from 'react';
import api from '../utils/axios';

const TestInviteModal = ({ isOpen, onClose, test, testId, onInvite }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [timeToStart, setTimeToStart] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [testInfo, setTestInfo] = useState(test || null);
  const [testLoading, setTestLoading] = useState(false);
  const [inviteResults, setInviteResults] = useState([]);

  useEffect(() => {
    if (isOpen && (!test || !test.title) && testId) {
      setTestLoading(true);
      api.get(`/api/test-detail/?test_id=${testId}`)
        .then(res => {
          setTestInfo(res.data);
        })
        .catch(() => setError('Failed to fetch test details.'))
        .finally(() => setTestLoading(false));
    } else if (isOpen && test) {
      setTestInfo(test);
    }
  }, [isOpen, test, testId]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      const teacherPk = localStorage.getItem('teacher_pk');
      if (!teacherPk) {
        setError('You must be logged in as a teacher to invite students.');
        setStudents([]);
        setLoading(false);
        return;
      }
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const teacherPk = localStorage.getItem('teacher_pk');
      const res = await api.get(`/api/teacher-students/?teacher_id=${teacherPk}`);
      if (res.status === 200) {
        const data = res.data;
        setStudents(data.students || []);
      } else {
        setError('Failed to fetch students.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (email) => {
    setSelectedStudents(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.email));
      setSelectAll(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInviteResults([]);
    if (selectedStudents.length === 0) {
      setError('Please select at least one student.');
      return;
    }
    if (!timeToStart) {
      setError('Please select a start time.');
      return;
    }
    if (!testInfo || (!testInfo.title && !testInfo.name)) {
      setError('Test information is missing. Please close and re-open the modal.');
      return;
    }
    const teacherName = localStorage.getItem('teacher_name') || (window.Cookies && window.Cookies.get && window.Cookies.get('teacher_name'));
    if (!teacherName) {
      setError('Teacher name is missing. Please log out and log in again.');
      return;
    }
    const pointValue =
      testInfo.point_value ??
      testInfo.points ??
      testInfo.total_points ??
      0;
    const inviteData = {
      teacher_name: teacherName,
      students: selectedStudents,
      time_to_start: timeToStart,
      duration_minutes: parseInt(durationMinutes),
      title: testInfo.title || testInfo.name || 'Untitled Test',
      description: testInfo.description,
      subject: testInfo.subject,
      point_value: pointValue,
      test_id: testId
    };
    try {
      const res = await api.post('/api/invite-test/', inviteData);
      const data = res.data;
      if (res.status === 200 && data.results) {
        setInviteResults(data.results);
        setError('');
        // Optionally call onInvite(data) if you want to close modal on full success
        // onInvite(data);
        // onClose();
      } else {
        setError(data?.error || 'Failed to send invites.');
      }
    } catch (error) {
      setError('Network error.');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Invite Students to Test</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {testLoading ? (
          <div style={{ marginBottom: '1rem', color: '#2563eb', fontWeight: 700 }}>Loading test info...</div>
        ) : testInfo && (
          <div style={{ marginBottom: '1rem', background: '#f3f6fd', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#2563eb', marginBottom: 4 }}>Test: {testInfo.title || testInfo.name}</div>
            {testInfo.subject && <div style={{ fontSize: 16, color: '#555' }}>Subject: {testInfo.subject}</div>}
            {testInfo.description && <div style={{ fontSize: 16, color: '#555' }}>Description: {testInfo.description}</div>}
            <div style={{ fontSize: 16, color: '#555' }}>
              Points: {testInfo.point_value ?? testInfo.points ?? testInfo.total_points ?? 0}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Start Time:
              <input
                type="datetime-local"
                value={timeToStart}
                onChange={(e) => setTimeToStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem'
                }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Duration (minutes):
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem'
                }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.5rem'
              }}
            />

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
            </div>

            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
              ) : error ? (
                <div style={{ padding: '1rem', color: 'red' }}>{error}</div>
              ) : (
                filteredStudents.map(student => (
                  <label
                    key={student.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.email)}
                      onChange={() => handleSelectStudent(student.email)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <div>
                      <div>{student.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>{student.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {!loading && students.length === 0 && (
            <div style={{ color: '#dc2626', margin: '1rem 0', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              No students found. Please invite or register students first.
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={students.length === 0}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                background: students.length === 0 ? '#ccc' : '#2563eb',
                color: 'white',
                cursor: students.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Send Invites
            </button>
          </div>
        </form>

        {inviteResults && inviteResults.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Invite Results:</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {inviteResults.map(r => (
                <li key={r.email} style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{r.email}:</span>{' '}
                  {r.status === 'invited' && <span style={{ color: '#22c55e' }}>Invitation sent</span>}
                  {r.status === 'duplicate' && <span style={{ color: '#f59e42' }}>Already invited to this test</span>}
                  {r.status === 'error' && <span style={{ color: '#dc2626' }}>Error: {r.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestInviteModal; 