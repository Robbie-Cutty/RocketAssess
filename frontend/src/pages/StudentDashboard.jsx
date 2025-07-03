import React, { useEffect, useState } from 'react';
import { FaBell, FaClipboardList, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import './StudentDashboard.css';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import sessionManager from '../utils/sessionManager';

const PAGE_SIZE = 3;

const TABS = [
  { key: 'invites', label: 'Invitations', icon: <FaBell /> },
  { key: 'tests', label: 'Queued Tests', icon: <FaClipboardList /> },
  { key: 'completed', label: 'Completed Tests', icon: <FaCheckCircle /> },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  // Check user role on component mount
  useEffect(() => {
    const userType = sessionManager.getUserType();
    if (userType !== 'student') {
      alert(`Access denied. You are logged in as a ${userType}. Redirecting to appropriate dashboard.`);
      if (userType === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (userType === 'organization') {
        navigate('/org-profile');
      } else {
        navigate('/login');
      }
      return;
    }
  }, [navigate]);

  const name = localStorage.getItem('student_name') || 'Student';
  const email = localStorage.getItem('student_email') || '';
  const [invites, setInvites] = useState([]);
  const [tests, setTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [testPage, setTestPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [testFilter, setTestFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('invites');
  const now = new Date();

  const fetchInvites = () => {
    if (!email) return;
    setLoading(true);
    setError('');
    api.get(`/api/student-test-invites/?email=${encodeURIComponent(email)}&added=false`)
      .then(res => {
        if (res.status === 200 && res.data) {
          setInvites(Array.isArray(res.data.invites) ? res.data.invites : []);
        } else {
          setInvites([]);
        }
        setError('');
      })
      .catch((err) => {
        console.error('Fetch invites error:', err);
        setError('Failed to fetch test invites.');
        setInvites([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchTests = () => {
    if (!email) return;
    api.get(`/api/student-test-invites/?email=${encodeURIComponent(email)}&added=true`)
      .then(res => {
        if (res.status === 200 && res.data) {
          setTests(Array.isArray(res.data.invites) ? res.data.invites : []);
        } else {
          setTests([]);
        }
      })
      .catch((err) => {
        console.error('Fetch tests error:', err);
        setTests([]);
      });
  };

  const fetchCompletedTests = () => {
    if (!email) return;
    api.get(`/api/student-completed-tests/?email=${encodeURIComponent(email)}`)
      .then(res => {
        if (res.status === 200) {
          setCompletedTests(Array.isArray(res.data) ? res.data : []);
        } else {
          setCompletedTests([]);
        }
      })
      .catch((err) => {
        console.error('Fetch completed tests error:', err);
        setCompletedTests([]);
      });
  };

  useEffect(() => {
    fetchInvites();
    fetchTests();
    fetchCompletedTests();
    // eslint-disable-next-line
  }, [email]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setInvitePage(1);
    setTestPage(1);
    setCompletedPage(1);
  }, [activeTab]);

  const handleAddToTests = async (inviteId) => {
    // Optimistically remove invite from UI (from all invites, not just paginated)
    const prevInvites = invites;
    const newInvites = invites.filter(inv => inv.id !== inviteId);
    setInvites(newInvites);
    try {
      const res = await api.post('/api/mark-invite-added/', { invite_id: inviteId });
      const data = res.data;
      if (res.status === 200 && data.success) {
        fetchTests(); // Only fetch tests, not invites
        setActiveTab('tests'); // Switch to queued tests tab
      } else {
        setError(data.error || 'Failed to add test.');
        setInvites(prevInvites); // Restore if error
      }
    } catch {
      setError('Network error.');
      setInvites(prevInvites); // Restore if error
    }
  };

  // --- Pagination and Filtering ---
  const totalInvitePages = Math.ceil(invites.length / PAGE_SIZE);
  const paginatedInvites = invites.slice((invitePage - 1) * PAGE_SIZE, invitePage * PAGE_SIZE);

  const filteredTests = tests.filter(t => {
    const searchLower = testSearch.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(searchLower) || (t.subject && t.subject.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;
    const start = new Date(t.time_to_start);
    const end = new Date(t.end_time);
    if (testFilter === 'upcoming') {
      return start > now && (start - now) / 36e5 <= 12;
    } else if (testFilter === 'live') {
      return start <= now && now < end;
    } else if (testFilter === 'expired') {
      return end < now;
    }
    return true;
  }).filter(t => !completedTests.some(ct => ct.test_id === t.test_id));
  const totalTestPages = Math.ceil(filteredTests.length / PAGE_SIZE);
  const paginatedTests = filteredTests.slice((testPage - 1) * PAGE_SIZE, testPage * PAGE_SIZE);
  
  const sortedCompletedTests = [...completedTests].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  const totalCompletedPages = Math.ceil(sortedCompletedTests.length / PAGE_SIZE);
  const paginatedCompletedTests = sortedCompletedTests.slice((completedPage - 1) * PAGE_SIZE, completedPage * PAGE_SIZE);

  // --- Layout ---
  return (
    <div className="student-dashboard-bg">
      <div className="student-dashboard-main-card">
        <h2 className="student-dashboard-title">Welcome, {name}!</h2>
        <p className="student-dashboard-subtitle">Your personalized student dashboard</p>
      </div>
      <div className="student-dashboard-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`student-dashboard-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      <div className="student-dashboard-content">
        {/* Invitations Tab */}
        {activeTab === 'invites' && (
          <div className="student-dashboard-section animate-fadein">
            <div className="student-dashboard-section-header">
              <span className="student-dashboard-section-title"><FaBell /> Unprocessed Invitations</span>
              <button className="student-dashboard-refresh" onClick={fetchInvites}><FaSyncAlt /> Refresh</button>
            </div>
            {loading ? (
              <div className="student-dashboard-loading">Loading...</div>
            ) : error ? (
              <div className="student-dashboard-error">{error}</div>
            ) : invites.length === 0 ? (
              <div className="student-dashboard-empty">No new test invitations.</div>
            ) : (
              <ul className="student-dashboard-list">
                {paginatedInvites.map(invite => (
                  <li className="student-dashboard-card" key={invite.id}>
                    <div className="student-dashboard-card-title">{invite.title}</div>
                    <div className="student-dashboard-card-meta">{invite.subject} &middot; {new Date(invite.time_to_start).toLocaleString()}</div>
                    <div className="student-dashboard-card-desc">{invite.description}</div>
                    <button className="student-dashboard-action" onClick={() => handleAddToTests(invite.id)}>
                      Add to Tests
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Pagination for notifications */}
            {totalInvitePages > 1 && (
              <div className="student-dashboard-pagination">
                <button onClick={() => setInvitePage(p => Math.max(1, p - 1))} disabled={invitePage === 1}>&larr;</button>
                {Array.from({ length: totalInvitePages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setInvitePage(i + 1)}
                    className={invitePage === i + 1 ? 'active' : ''}
                    disabled={invitePage === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setInvitePage(p => Math.min(totalInvitePages, p + 1))} disabled={invitePage === totalInvitePages}>&rarr;</button>
              </div>
            )}
          </div>
        )}
        {/* Queued Tests Tab */}
        {activeTab === 'tests' && (
          <div className="student-dashboard-section animate-fadein">
            <div className="student-dashboard-section-header">
              <span className="student-dashboard-section-title"><FaClipboardList /> Queued Tests & Results</span>
            </div>
            <div className="student-dashboard-controls">
              <input
                type="text"
                placeholder="Search tests..."
                value={testSearch}
                onChange={e => { setTestSearch(e.target.value); setTestPage(1); }}
                className="student-dashboard-search"
              />
              <select
                value={testFilter}
                onChange={e => { setTestFilter(e.target.value); setTestPage(1); }}
                className="student-dashboard-filter"
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            {paginatedTests.length === 0 ? (
              <div className="student-dashboard-empty">No tests found.</div>
            ) : (
              <ul className="student-dashboard-list">
                {paginatedTests.map(invite => {
                  const nowTime = new Date();
                  const startTime = new Date(invite.time_to_start);
                  const endTime = new Date(invite.end_time);
                  const isLive = startTime <= nowTime && nowTime < endTime;
                  return (
                    <li className="student-dashboard-card" key={invite.id}>
                      <div className="student-dashboard-card-title queued">{invite.title}</div>
                      <div className="student-dashboard-card-meta">
                        <b>Start:</b> {new Date(invite.time_to_start).toLocaleString()}<br />
                        <b>End:</b> {invite.end_time ? new Date(invite.end_time).toLocaleString() : 'N/A'}<br />
                        <b>Duration:</b> {invite.end_time && invite.time_to_start ? Math.round((new Date(invite.end_time) - new Date(invite.time_to_start)) / 60000) : 'N/A'} min
                      </div>
                      <div className="student-dashboard-card-desc">{invite.description}</div>
                      {isLive && invite.test_id && (
                        <button
                          className="student-dashboard-action live"
                          onClick={async () => {
                            try {
                              await api.post('/api/start-test/', {
                                test_id: invite.test_id,
                                student_email: email
                              });
                              navigate(`/test/${invite.test_id}`);
                            } catch (err) {
                              alert('Failed to start test. Please try again.');
                            }
                          }}
                        >
                          Start Test
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {/* Pagination for tests */}
            {totalTestPages > 1 && (
              <div className="student-dashboard-pagination">
                <button onClick={() => setTestPage(p => Math.max(1, p - 1))} disabled={testPage === 1}>&larr;</button>
                {Array.from({ length: totalTestPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setTestPage(i + 1)}
                    className={testPage === i + 1 ? 'active' : ''}
                    disabled={testPage === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setTestPage(p => Math.min(totalTestPages, p + 1))} disabled={testPage === totalTestPages}>&rarr;</button>
              </div>
            )}
          </div>
        )}
        {/* Completed Tests Tab */}
        {activeTab === 'completed' && (
          <div className="student-dashboard-section animate-fadein">
            <div className="student-dashboard-section-header">
              <span className="student-dashboard-section-title"><FaCheckCircle /> Completed Tests</span>
              <button className="student-dashboard-refresh green" onClick={fetchCompletedTests}><FaSyncAlt /> Refresh</button>
            </div>
            {paginatedCompletedTests.length === 0 ? (
              <div className="student-dashboard-empty">No completed tests found.</div>
            ) : (
              <ul className="student-dashboard-list">
                {paginatedCompletedTests.map(test => (
                  <li className="student-dashboard-card completed" key={test.submission_id}>
                    <div className="student-dashboard-card-title completed">{test.test_title}</div>
                    <div className="student-dashboard-card-meta">
                      <b>Subject:</b> {test.test_subject}<br />
                      <b>Score:</b> {test.score.toFixed(1)}%<br />
                      <b>Entered:</b> {test.entered_at ? new Date(test.entered_at).toLocaleString() : '-'}<br />
                      <b>Completed:</b> {test.submitted_at ? new Date(test.submitted_at).toLocaleString() : '-'}<br />
                      <b>Duration:</b> {typeof test.duration === 'number' ? Math.round(test.duration / 60) + ' min' : '-'}
                    </div>
                    <button
                      className="student-dashboard-action"
                      onClick={() => navigate(`/review/${test.submission_id}`)}
                    >
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Pagination for completed tests */}
            {totalCompletedPages > 1 && (
              <div className="student-dashboard-pagination">
                <button onClick={() => setCompletedPage(p => Math.max(1, p - 1))} disabled={completedPage === 1}>&larr;</button>
                {Array.from({ length: totalCompletedPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCompletedPage(i + 1)}
                    className={completedPage === i + 1 ? 'active' : ''}
                    disabled={completedPage === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCompletedPage(p => Math.min(totalCompletedPages, p + 1))} disabled={completedPage === totalCompletedPages}>&rarr;</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
