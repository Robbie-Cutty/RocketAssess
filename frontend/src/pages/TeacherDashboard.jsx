import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FaUsers } from 'react-icons/fa';
import TestInviteModal from '../components/TestInviteModal';
import AnalyticsCard from '../components/AnalyticsCard';
import api from '../utils/axios';
import sessionManager from '../utils/sessionManager';
import './TeacherDashboard.css';
import QuestionPool from './QuestionPool';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  
  // Check user role on component mount
  useEffect(() => {
    const userType = sessionManager.getUserType();
    if (userType !== 'teacher') {
      alert(`Access denied. You are logged in as a ${userType}. Redirecting to appropriate dashboard.`);
      if (userType === 'student') {
        navigate('/student-dashboard');
      } else if (userType === 'organization') {
        navigate('/org-profile');
      } else {
        navigate('/login');
      }
      return;
    }
  }, [navigate]);

  // Move authentication state into the component
  const [teacherPk, setTeacherPk] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [editingQ, setEditingQ] = useState(null);
  const [editingQIdx, setEditingQIdx] = useState(null);
  const [qError, setQError] = useState('');
  const [qSuccess, setQSuccess] = useState('');
  const [editForm, setEditForm] = useState({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', point_value: 1
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', point_value: 1
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [showAddTestForm, setShowAddTestForm] = useState(false);
  const [addTestForm, setAddTestForm] = useState({ name: '', subject: '', description: '' });
  const [addTestError, setAddTestError] = useState('');
  const [addTestLoading, setAddTestLoading] = useState(false);

  const [testPage, setTestPage] = useState(1);
  const TESTS_PER_PAGE = 6;

  const [questionPool, setQuestionPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState('');

  const [poolPage, setPoolPage] = useState(1);
  const POOL_PAGE_SIZE = 4;
  const [paginatedPool, setPaginatedPool] = useState([]);
  const [poolSearch, setPoolSearch] = useState('');

  const [selectedPoolIds, setSelectedPoolIds] = useState([]);

  const [showResultsFor, setShowResultsFor] = useState(null);
  const [showInviteFor, setShowInviteFor] = useState(null);

  const [testPoints, setTestPoints] = useState({});

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStudentsList, setInviteStudentsList] = useState([]);
  const [selectedInviteStudents, setSelectedInviteStudents] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [selectAllInvite, setSelectAllInvite] = useState(false);

  const [studentsSearch, setStudentsSearch] = useState('');
  const [studentsPage, setStudentsPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitePage, setInvitePage] = useState(1);
  const STUDENTS_PER_PAGE = 4;

  const [showTestInviteModal, setShowTestInviteModal] = useState(false);
  const [selectedTestForInvite, setSelectedTestForInvite] = useState(null);

  const [backButtonHover, setBackButtonHover] = useState(false);

  const [testTimeRanges, setTestTimeRanges] = useState({});

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalTests: 0,
    totalQuestions: 0,
    totalStudents: 0,
    averageScore: 0
  });

  // Add state for scheduled window
  const [selectedTestWindow, setSelectedTestWindow] = useState(null);

  // 🧠 Add state
  const [duplicateInvites, setDuplicateInvites] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Initialize authentication data
  useEffect(() => {
    const initializeAuth = () => {
      const pkFromCookie = Cookies.get('teacher_pk');
      const pkFromStorage = localStorage.getItem('teacher_pk');
      const nameFromCookie = Cookies.get('teacher_name');
      const orgNameFromCookie = Cookies.get('org_name');
      
      const pk = pkFromCookie || pkFromStorage;
      
      if (pk) {
        setTeacherPk(pk);
        setTeacherName(nameFromCookie || '');
        setOrgName(orgNameFromCookie || '');
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const togglePoolSelect = (id) => {
    setSelectedPoolIds(selected =>
      selected.includes(id)
        ? selected.filter(qid => qid !== id)
        : [...selected, id]
    );
  };

  const selectAllPool = () => setSelectedPoolIds(paginatedPool.map(q => q.id));
  const deselectAllPool = () => setSelectedPoolIds([]);

  const handleAddAllSelected = async () => {
    setAddLoading(true);
    setAddError('');
    try {
      setQuestions(prevQuestions => {
        const existingTexts = new Set(prevQuestions.map(q => q.text.trim().toLowerCase()));
        const uniqueQuestions = paginatedPool.filter(q => 
          selectedPoolIds.includes(q.id) && !existingTexts.has(q.text.trim().toLowerCase())
        );
        
        // Add all unique questions to state immediately
        const newQuestions = [...prevQuestions, ...uniqueQuestions];
        
        // Create questions in backend
        uniqueQuestions.forEach(q => {
          api.post('/api/question-create/', { ...q, test: selectedTest.id, subject: selectedTest.subject })
            .then(res => {
              if (res.status === 201) {
                // Update with the actual backend response (which has the ID)
                setQuestions(current => 
                  current.map(question => 
                    question === q ? res.data : question
                  )
                );
              } else {
                setAddError('Failed to add one or more questions from pool.');
                // Remove from state if backend failed
                setQuestions(current => current.filter(question => question !== q));
              }
            })
            .catch(() => {
              setAddError('Network error.');
              // Remove from state if backend failed
              setQuestions(current => current.filter(question => question !== q));
            });
        });
        
        setSelectedPoolIds([]);
        setAddLoading(false);
        return newQuestions;
      });
    } catch {
      setAddError('Network error.');
      setAddLoading(false);
    }
  };

  useEffect(() => {
    if (teacherPk) fetchTests();
  }, [teacherPk]);

  const fetchTests = async () => {
    const res = await api.get(`/api/test-list/?teacher_id=${teacherPk}`);
    if (res.status === 200) {
      const data = res.data;
      setTests(data.results || data);
      calculateAnalytics(data.results || data);
    }
  };

  const calculateAnalytics = async (testData) => {
    try {
      const res = await api.get(`/api/teacher-analytics/?teacher_id=${teacherPk}`);
      if (res.status === 200 && res.data) {
        const data = res.data;
        setAnalytics({
          totalTests: data.total_tests || 0,
          totalQuestions: data.total_questions || 0,
          totalStudents: data.total_students || 0,
          averageScore: data.average_score || 0
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
      // Fallback to basic calculations
      const totalTests = Array.isArray(testData) ? testData.length : 0;
      setAnalytics({
        totalTests: totalTests,
        totalQuestions: 0,
        totalStudents: 0,
        averageScore: 0
      });
    }
  };

  const fetchQuestions = async (testId) => {
    const res = await api.get(`/api/question-list/?test_id=${testId}`);
    if (res.status === 200) {
      const data = res.data;
      setQuestions(data);
      setSelectedQIndex(0);
    }
  };

  const fetchQuestionPool = async (subject) => {
    setPoolLoading(true);
    setPoolError('');
    try {
      const res = await api.get(`/api/question-pool/?teacher_id=${teacherPk}&subject=${encodeURIComponent(subject)}`);
      if (res.status === 200) {
        const data = res.data;
        setPaginatedPool(data.results || []); // Use the results array from the paginated response
        setPoolPage(1); // reset to first page on fetch
      } else {
        setPoolError('Failed to fetch question pool.');
      }
    } catch (err) {
      setPoolError('Network error.');
    } finally {
      setPoolLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTest) {
      fetchQuestionPool(selectedTest.subject);
    }
    // eslint-disable-next-line
  }, [selectedTest]);

  const handleSelectTest = async (test) => {
    setSelectedTest(test);
    fetchQuestions(test.id);
    fetchQuestionPool(test.subject);
    // Fetch scheduled window info
    try {
      const res = await api.get(`/api/list-test-invites/?test_id=${test.id}`);
      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const starts = res.data.map(i => new Date(i.time_to_start));
        const ends = res.data.map(i => new Date(i.end_time));
        const minStart = new Date(Math.min(...starts));
        const maxEnd = new Date(Math.max(...ends));
        const duration = res.data[0].duration_minutes; // assume all invites have same duration
        setSelectedTestWindow({ start: minStart, end: maxEnd, duration });
      } else {
        setSelectedTestWindow(null);
      }
    } catch {
      setSelectedTestWindow(null);
    }
  };

  const handleEditQuestion = (q, idx) => {
    setEditingQ(q.id);
    setEditingQIdx(idx);
    setEditForm({
      text: q.text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      point_value: q.point_value,
    });
    setQError('');
    setQSuccess('');
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setQError('');
    setQSuccess('');
    try {
      const res = await api.patch(`/api/questions/${editingQ}/`, { ...editForm });
      if (res.status === 200) {
        const updated = res.data;
        setQuestions(prev => prev.map((q, i) => i === editingQIdx ? updated : q));
        setQSuccess('Question updated!');
        setEditingQ(null);
        setEditingQIdx(null);
        fetchTestPoints(selectedTest.id); // Always refresh points
      } else {
        setQError('Failed to update question.');
      }
    } catch {
      setQError('Network error.');
    }
  };

  const handleCancelEdit = () => {
    setEditingQ(null);
    setEditingQIdx(null);
    setQError('');
    setQSuccess('');
  };

  const handleDeleteQuestion = async (q, idx) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setQError('');
    setQSuccess('');
    try {
      const res = await api.delete(`/api/questions/${q.id}/`);
      if (res.status !== 204) {
        setQError('Failed to delete question.');
        return;
      }
      // Success - remove from UI immediately
      setQuestions(prevQuestions => {
        const updated = prevQuestions.filter((question) => question.id !== q.id);
        // Adjust selectedQIndex if needed
        if (selectedQIndex >= updated.length) {
          setSelectedQIndex(Math.max(0, updated.length - 1));
        }
        return updated;
      });
      setQSuccess('Question deleted.');
      if (editingQIdx === idx) {
        setEditingQ(null);
        setEditingQIdx(null);
      }
      fetchTestPoints(selectedTest.id); // Always refresh points
    } catch {
      setQError('Network error.');
    }
  };

  const handleAddFormChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await api.post('/api/question-create/', { ...addForm, test: selectedTest.id });
      if (res.status === 201) {
        const newQ = res.data;
        setQuestions([...questions, newQ]);
        setShowAddForm(false);
        setAddForm({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', point_value: 1 });
        fetchTestPoints(selectedTest.id); // Always refresh points
      } else {
        setAddError('Failed to add question.');
      }
    } catch {
      setAddError('Network error.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddTestFormChange = (e) => {
    setAddTestForm({ ...addTestForm, [e.target.name]: e.target.value });
  };

  const handleAddTestFormSubmit = async (e) => {
    e.preventDefault();
    setAddTestError('');
    setAddTestLoading(true);
    try {
      const res = await api.post('/api/test-create/', { ...addTestForm, teacher: teacherPk });
      if (res.status === 201) {
        setShowAddTestForm(false);
        setAddTestForm({ name: '', subject: '', description: '' });
        fetchTests(); // Refresh the test list from backend
        // After fetching, refresh points for the new test
        if (res.data && res.data.id) fetchTestPoints(res.data.id);
      } else {
        setAddTestError('Failed to add test.');
      }
    } catch {
      setAddTestError('Network error.');
    } finally {
      setAddTestLoading(false);
    }
  };

  // Always show newest tests first
  const sortedTests = [...tests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const filteredTests = sortedTests.filter(test => test.name.toLowerCase().includes(search.toLowerCase()) && (subjectFilter === '' || test.subject === subjectFilter));
  const totalTestPages = Math.ceil(filteredTests.length / TESTS_PER_PAGE);
  const paginatedTests = filteredTests.slice((testPage - 1) * TESTS_PER_PAGE, testPage * TESTS_PER_PAGE);

  const filteredPool = paginatedPool.filter(q => {
    const searchLower = poolSearch.toLowerCase();
    return (
      q.text.toLowerCase().includes(searchLower) ||
      q.option_a.toLowerCase().includes(searchLower) ||
      q.option_b.toLowerCase().includes(searchLower) ||
      q.option_c.toLowerCase().includes(searchLower) ||
      q.option_d.toLowerCase().includes(searchLower)
    );
  });

  const poolTotalPages = Math.ceil(filteredPool.length / POOL_PAGE_SIZE);
  const poolPageQuestions = filteredPool.slice((poolPage - 1) * POOL_PAGE_SIZE, poolPage * POOL_PAGE_SIZE);

  // Pagination helper for windowed page numbers
  const getPageNumbers = (current, total) => {
    let pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
        pages.push(i);
      }
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('org_code');
    Cookies.remove('org_name');
    Cookies.remove('teacher_name');
    Cookies.remove('teacher_id');
    Cookies.remove('teacher_pk');
    Cookies.remove('user_email');
    navigate('/');
    window.location.reload();
  };

  const fetchTestPoints = async (testId) => {
    try {
      const res = await api.get(`/api/question-list/?test_id=${testId}`);
      if (res.status === 200) {
        const data = res.data;
        const total = Array.isArray(data)
          ? data.reduce((sum, q) => sum + (q.point_value || 0), 0)
          : Array.isArray(data.questions)
            ? data.questions.reduce((sum, q) => sum + (q.point_value || 0), 0)
            : 0;
        setTestPoints(prev => ({ ...prev, [testId]: total }));
      } else {
        setTestPoints(prev => ({ ...prev, [testId]: '...' }));
      }
    } catch {
      setTestPoints(prev => ({ ...prev, [testId]: '...' }));
    }
  };

  useEffect(() => {
    paginatedTests.forEach(test => {
      if (testPoints[test.id] === undefined) {
        fetchTestPoints(test.id);
      }
    });
    // eslint-disable-next-line
  }, [paginatedTests]);

  const fetchStudentsList = async () => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const res = await api.get('/api/teacher-students/?teacher_id=' + teacherPk);
      if (res.status === 200) {
        const data = res.data;
        setStudentsList(data.students || []);
      } else {
        setStudentsError('Failed to fetch students.');
      }
    } catch {
      setStudentsError('Network error.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchInviteStudentsList = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await api.get('/api/teacher-students/?teacher_id=' + teacherPk);
      if (res.status === 200) {
        const data = res.data;
        setInviteStudentsList(data.students || []);
        setSelectedInviteStudents([]);
        setSelectAllInvite(false);
      } else {
        setInviteError('Failed to fetch students.');
      }
    } catch {
      setInviteError('Network error.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSelectInviteStudent = (email) => {
    setSelectedInviteStudents(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAllInvite = () => {
    if (selectAllInvite) {
      setSelectedInviteStudents([]);
      setSelectAllInvite(false);
    } else {
      setSelectedInviteStudents(inviteStudentsList.map(s => s.email));
      setSelectAllInvite(true);
    }
  };

  const handleInviteSelected = async () => {
    setInviteLoading(true);
    setInviteError('');

    try {
      if (!selectedTestForInvite) {
        setInviteError('No test selected for inviting students.');
        setInviteLoading(false);
        return;
      }
      const payload = {
        teacher_name: teacherName,
        students: selectedInviteStudents,
        time_to_start: selectedTestWindow?.start?.toISOString() || new Date().toISOString(),
        duration_minutes: selectedTestWindow?.duration || selectedTestForInvite.duration_minutes || 60,
        title: selectedTestForInvite.name,
        description: selectedTestForInvite.description,
        subject: selectedTestForInvite.subject,
        point_value: testPoints[selectedTestForInvite.id] || 1,
        test_id: selectedTestForInvite.id,
      };
      const res = await api.post('/api/invite-test/', payload);

      if (res.status === 200) {
        setShowInviteModal(false);
        setSelectedInviteStudents([]);
        setSelectAllInvite(false);
      } else {
        setDuplicateInvites([res.data?.error || 'Failed to send invites.']);
        setShowDuplicateDialog(true);
      }
    } catch (err) {
      if (err.isDuplicateInvite) {
        setDuplicateInvites(err.duplicates);
        setShowDuplicateDialog(true);
      } else if (err.response && err.response.status === 409 && err.response.data.duplicates) {
        setDuplicateInvites(err.response.data.duplicates);
        setShowDuplicateDialog(true);
      } else {
        setDuplicateInvites([err.response?.data?.error || 'A network or server error occurred. Please try again.']);
        setShowDuplicateDialog(true);
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // Filtered and paginated students for All Students modal
  const filteredStudents = studentsList.filter(s =>
    s.name.toLowerCase().includes(studentsSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentsSearch.toLowerCase())
  );
  const totalStudentPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice((studentsPage - 1) * STUDENTS_PER_PAGE, studentsPage * STUDENTS_PER_PAGE);

  // Filtered and paginated students for Invite Students modal
  const filteredInviteStudents = inviteStudentsList.filter(s =>
    s.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(inviteSearch.toLowerCase())
  );
  const totalInvitePages = Math.ceil(filteredInviteStudents.length / STUDENTS_PER_PAGE);
  const paginatedInviteStudents = filteredInviteStudents.slice((invitePage - 1) * STUDENTS_PER_PAGE, invitePage * STUDENTS_PER_PAGE);

  const handleTestInvite = (test) => {
    setSelectedTestForInvite(test);
    setShowTestInviteModal(true);
  };

  const handleInviteSuccess = (data) => {
    setShowTestInviteModal(false);
    setSelectedTestForInvite(null);
    alert('Test invitations sent successfully!');
  };

  useEffect(() => {
    // Fetch time ranges for all tests on load or when tests change
    const fetchTimeRanges = async () => {
      const ranges = {};
      for (const test of tests) {
        try {
          const res = await api.get(`/api/list-test-invites/?test_id=${test.id}`);
          if (res.status === 200) {
            const invites = res.data;
            if (Array.isArray(invites) && invites.length > 0) {
              const starts = invites.map(i => new Date(i.time_to_start));
              const ends = invites.map(i => new Date(i.end_time));
              const minStart = new Date(Math.min(...starts));
              const maxEnd = new Date(Math.max(...ends));
              ranges[test.id] = { start: minStart, end: maxEnd };
            }
          }
        } catch {}
      }
      setTestTimeRanges(ranges);
    };
    if (tests.length > 0) fetchTimeRanges();
  }, [tests]);

  if (isLoading) {
    return (
      <div style={{padding: 40, textAlign: 'center', fontSize: 18}}>
        Loading dashboard...
      </div>
    );
  }

  if (!teacherPk) {
    return (
      <div style={{padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 20}}>
        You must be logged in as a teacher to access the dashboard.<br/>
        <Link to="/login" style={{color: '#2563eb', textDecoration: 'underline'}}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-container">
      <div className="teacher-dashboard-main">
        <div className="teacher-dashboard-header">
          <div>
            <h2 className="teacher-dashboard-title">Teacher Dashboard</h2>
            {teacherName && <div className="teacher-dashboard-subtitle">{teacherName}</div>}
            {orgName && <div className="teacher-dashboard-org">{orgName}</div>}
          </div>
          <div className="teacher-dashboard-actions">
            <Link to="/create-test" className="teacher-dashboard-btn teacher-dashboard-btn-primary">
              <span className="text-xl font-bold">+</span> Create Test
            </Link>
            <Link to="/invite-students" className="teacher-dashboard-btn teacher-dashboard-btn-outline">
              <span role="img" aria-label="invite">📧</span> Invite Students
            </Link>
            <button
              className="teacher-dashboard-btn teacher-dashboard-btn-outline"
              onClick={() => { setShowStudentsModal(true); fetchStudentsList(); }}
            >
              <span role="img" aria-label="students">👥</span> View Students
            </button>
          </div>
        </div>

        <div className="teacher-dashboard-analytics">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Dashboard Analytics</h3>
          <div className="teacher-dashboard-analytics-cards">
            <AnalyticsCard
              title="Total Tests"
              value={analytics.totalTests}
              subtitle="Created tests"
              icon="chart"
              color="blue"
            />
            <AnalyticsCard
              title="Total Questions"
              value={analytics.totalQuestions}
              subtitle="Across all tests"
              icon="check"
              color="green"
            />
            <AnalyticsCard
              title="Total Students"
              value={analytics.totalStudents}
              subtitle="Enrolled students"
              icon="users"
              color="purple"
            />
            </div>
        </div>

        {!selectedTest ? (
          <div className="card w-full md:w-auto max-w-lg mb-6" style={{ background: 'none', boxShadow: 'none', border: 'none', maxWidth: 1000, width: '100%', margin: 0, padding: 0 }}>
            <h3 className="text-lg font-semibold mb-2 text-primary" style={{ fontSize: 22, marginBottom: 18 }}>Your Tests</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search tests by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "1px solid #bdbdbd",
                  fontSize: 15,
                  maxWidth: 320
                }}
              />
              <select
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                style={{
                  minWidth: 120,
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "1px solid #bdbdbd",
                  fontSize: 14,
                  maxWidth: 180
                }}
              >
                <option value="">All Subjects</option>
                {[...new Set(tests.map(t => t.subject).filter(Boolean))].map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 7,
                  border: '1px solid #bdbdbd',
                  background: '#f3f4f6',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Refresh the entire page"
              >
                &#x21bb; Refresh
              </button>
            </div>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 16,
                listStyle: 'none',
                padding: 0,
                margin: 0,
                width: '100%',
              }}
            >
              {paginatedTests.map(test => (
                <li
                  key={test.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 20,
                    borderRadius: 16,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    minHeight: 100,
                    boxShadow: '0 2px 8px #0001',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>
                      {test.name} <span style={{ color: '#2563eb', fontWeight: 500, fontSize: 15 }}>
                        ({testPoints[test.id] !== undefined ? `${testPoints[test.id]} pts` : '...' })
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: '#555',
                        marginTop: 3,
                        textShadow: '0 1px 4px #0001'
                      }}
                    >
                      {test.subject}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: '#888',
                        marginTop: 2,
                        textShadow: '0 1px 4px #0001'
                      }}
                    >
                      
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'auto' }}>
                    <button
                      className="btn btn-xs btn-outline"
                      style={{ fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '7px 16px' }}
                      onClick={() => handleSelectTest(test)}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleTestInvite(test)}
                      className="btn btn-xs btn-outline"
                      style={{ fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '7px 16px' }}
                    >
                      Invite Students
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '7px 16px', marginLeft: 8 }}
                      onClick={() => navigate(`/test-results/${test.id}`)}
                    >
                      View Results
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {/* Pagination: windowed page numbers */}
            {totalTestPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                {getPageNumbers(testPage, totalTestPages).map((page, idx) => {
                  if (page === '...') {
                    return <span key={page + idx} style={{ fontSize: 22, color: '#888', minWidth: 28 }}>...</span>;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setTestPage(page)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: page === testPage ? '#111' : '#2563eb',
                        fontWeight: page === testPage ? 700 : 400,
                        fontSize: 22,
                        cursor: page === testPage ? 'default' : 'pointer',
                        outline: 'none',
                        padding: 0,
                        minWidth: 28
                      }}
                      disabled={page === testPage}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 18, marginBottom: 18, textAlign: 'left' }}>
              
            </div>
          </div>
        ) : (
          <div className="card w-full md:w-auto mb-0" style={{ maxWidth: 1100, width: '100%', margin: '0 auto', position: 'relative' }}>
            <button
              onClick={() => setSelectedTest(null)}
              onMouseEnter={() => setBackButtonHover(true)}
              onMouseLeave={() => setBackButtonHover(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: backButtonHover ? '#e5e7eb' : '#f3f4f6', // Hover effect
                color: 'blueund',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s', // Smooth transition
              }}
            >
              &larr; Back to Dashboard
            </button>
            <h3 className="text-lg font-semibold mb-2 text-primary" style={{ fontSize: 24 }}>Questions for: {selectedTest.name}</h3>
            

            <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', width: '100%', flexWrap: 'nowrap', marginBottom: 24 }}>
              <div style={{ flex: '1 1 700px', minWidth: 420, maxWidth: 700 }}>
                <h4 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Question Pool for "{selectedTest.subject}"</h4>
                <div style={{ marginBottom: 24 }}>
                  {!showAddForm && (
                    <button className="btn btn-primary mb-4" onClick={() => setShowAddForm(true)} style={{ width: '100%' }}>
                      Add Question
                    </button>
                  )}
                  {showAddForm && (
                    <form onSubmit={handleAddFormSubmit} style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 2px 8px #0001', border: '1px solid #e5e7eb', marginBottom: 16 }}>
                      <input type="text" name="text" value={addForm.text} onChange={handleAddFormChange} placeholder="Question text" required style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 16, marginBottom: 8 }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <input type="text" name="option_a" placeholder="Option A" value={addForm.option_a} onChange={handleAddFormChange} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15 }} />
                        <input type="text" name="option_b" placeholder="Option B" value={addForm.option_b} onChange={handleAddFormChange} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15 }} />
                        <input type="text" name="option_c" placeholder="Option C" value={addForm.option_c} onChange={handleAddFormChange} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15 }} />
                        <input type="text" name="option_d" placeholder="Option D" value={addForm.option_d} onChange={handleAddFormChange} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <select name="correct_answer" value={addForm.correct_answer} onChange={handleAddFormChange} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15, width: 80 }}>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <input type="number" name="point_value" min="1" value={addForm.point_value} onChange={handleAddFormChange} required style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #bdbdbd', fontSize: 15, width: 80 }} />
                      </div>
                      {addError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{addError}</div>}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" className="btn btn-primary" disabled={addLoading} style={{ padding: '10px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16 }}>
                          {addLoading ? 'Adding...' : 'Add'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)} style={{ padding: '10px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16 }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <button className="btn btn-xs btn-outline" onClick={selectAllPool} disabled={paginatedPool.length === 0}>
                    Select All
                  </button>
                  <button className="btn btn-xs btn-outline" onClick={deselectAllPool} disabled={selectedPoolIds.length === 0}>
                    Deselect All
                  </button>
                  <button className="btn btn-xs btn-primary" onClick={handleAddAllSelected} disabled={selectedPoolIds.length === 0 || addLoading}>
                    {addLoading ? 'Adding...' : 'Add All Selected'}
                  </button>
                  <span style={{ fontSize: 15, color: '#2563eb', fontWeight: 600 }}>
                    {selectedPoolIds.length} selected
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Search questions or choices..."
                  value={poolSearch}
                  onChange={e => setPoolSearch(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #bdbdbd",
                    fontSize: 16,
                    marginBottom: 16,
                    width: "100%"
                  }}
                />
                {poolLoading ? (
                  <p>Loading...</p>
                ) : poolError ? (
                  <p style={{ color: '#dc2626' }}>{poolError}</p>
                ) : filteredPool.length === 0 ? (
                  <p style={{ color: '#888' }}>No questions in the pool for this subject.</p>
                ) : (
                  <QuestionPool
                    testId={selectedTest.id}
                    onAdd={async (q) => {
                      setAddLoading(true);
                      setAddError('');
                      try {
                        // Use functional form to get latest state
                        setQuestions(prevQuestions => {
                          const exists = prevQuestions.some(qq => qq.text.trim().toLowerCase() === q.text.trim().toLowerCase());
                          if (exists) {
                            // silently skip duplicate
                            setAddLoading(false);
                            return prevQuestions; // return unchanged state
                          }
                          
                          // Add the question immediately to state
                          const newQuestions = [...prevQuestions, q];
                          
                          // Also create the question in backend
                          api.post('/api/question-create/', { ...q, test: selectedTest.id, subject: selectedTest.subject })
                            .then(res => {
                              if (res.status === 201) {
                                // Update with the actual backend response (which has the ID)
                                setQuestions(current => 
                                  current.map(question => 
                                    question === q ? res.data : question
                                  )
                                );
                              } else {
                                setAddError('Failed to add question from pool.');
                                // Remove from state if backend failed
                                setQuestions(current => current.filter(question => question !== q));
                              }
                            })
                            .catch(() => {
                              setAddError('Network error.');
                              // Remove from state if backend failed
                              setQuestions(current => current.filter(question => question !== q));
                            })
                            .finally(() => {
                              setAddLoading(false);
                            });
                          
                          return newQuestions;
                        });
                      } catch {
                        setAddError('Network error.');
                        setAddLoading(false);
                      }
                    }}
                    addedQuestionIds={questions.map(q => q.id)}
                  />
                )}
              </div>
              <div style={{ flex: '2 1 700px', minWidth: 400, maxWidth: 900 }}>
                {questions.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
                    {questions.map((q, idx) => (
                      <button
                        key={q.id || idx}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: idx === selectedQIndex ? '2px solid #2563eb' : '1px solid #e5e7eb',
                          background: idx === selectedQIndex ? '#2563eb' : '#fff',
                          color: idx === selectedQIndex ? '#fff' : '#222',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedQIndex(idx)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                {questions.length === 0 ? (
                  <p className="text-secondary">No questions yet.</p>
                ) : (
                  <div
                    style={{
                      marginBottom: 40,
                      width: "100%",
                      maxWidth: 900,
                      background: "#fff",
                      borderRadius: 16,
                      boxShadow: "0 2px 8px #0001",
                      border: "1px solid #e5e7eb",
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 18
                    }}
                    id={`question-card-${selectedQIndex}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: "#2563eb" }}>{selectedQIndex + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 24 }}>
                        {questions[selectedQIndex].text}
                        <span style={{ color: '#2563eb', fontWeight: 500, fontSize: 20, marginLeft: 10 }}>
                          ({questions[selectedQIndex].point_value} pts)
                        </span>
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const value = questions[selectedQIndex][`option_${opt.toLowerCase()}`];
                        const isCorrect = questions[selectedQIndex].correct_answer === opt;
                        return (
                          <div
                            key={opt}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 18px',
                              borderRadius: '12px',
                              border: isCorrect ? '2px solid #22c55e' : '1px solid #e5e7eb',
                              background: isCorrect ? '#dcfce7' : '#f9fafb',
                              marginBottom: '2px',
                              fontSize: '1.15rem',
                              fontWeight: isCorrect ? 700 : 400,
                              transition: 'background 0.2s, border 0.2s'
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{opt}</span>
                            <span style={{ marginLeft: 16 }}>{value}</span>
                            {isCorrect && (
                              <span style={{ marginLeft: 12, color: '#22c55e', fontWeight: 700, fontSize: '1.5rem' }}>&#10003;</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                      <button className="btn btn-xs btn-outline" onClick={() => handleEditQuestion(questions[selectedQIndex], selectedQIndex)}>
                        Edit
                      </button>
                      <button className="btn btn-xs btn-danger" onClick={() => handleDeleteQuestion(questions[selectedQIndex], selectedQIndex)}>
                        Delete
                      </button>
                    </div>
                    {editingQ === questions[selectedQIndex].id && (
                      <form
                        onSubmit={handleEditFormSubmit}
                        style={{
                          background: "#fff",
                          padding: 24,
                          borderRadius: 16,
                          marginTop: 24,
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          maxWidth: 520,
                          boxShadow: "0 4px 24px #0002",
                          border: "1px solid #e5e7eb"
                        }}
                      >
                        <input
                          type="text"
                          name="text"
                          value={editForm.text}
                          onChange={handleEditFormChange}
                          placeholder="Question text"
                          required
                          style={{
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "1px solid #bdbdbd",
                            fontSize: 16
                          }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <input type="text" name="option_a" placeholder="Option A" value={editForm.option_a} onChange={handleEditFormChange} required style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15 }} />
                          <input type="text" name="option_b" placeholder="Option B" value={editForm.option_b} onChange={handleEditFormChange} required style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15 }} />
                          <input type="text" name="option_c" placeholder="Option C" value={editForm.option_c} onChange={handleEditFormChange} required style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15 }} />
                          <input type="text" name="option_d" placeholder="Option D" value={editForm.option_d} onChange={handleEditFormChange} required style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15 }} />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <select name="correct_answer" value={editForm.correct_answer} onChange={handleEditFormChange} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15, width: 80 }}>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                          <input type="number" name="point_value" min="1" value={editForm.point_value} onChange={handleEditFormChange} required style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #bdbdbd", fontSize: 15, width: 80 }} />
                        </div>
                        {qError && <div style={{ color: "#dc2626", fontSize: 13 }}>{qError}</div>}
                        {qSuccess && <div style={{ color: "#16a34a", fontSize: 13 }}>{qSuccess}</div>}
                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                          <button type="submit" className="btn btn-primary" style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: 16 }}>
                            Save Changes
                          </button>
                          <button type="button" className="btn btn-outline" onClick={handleCancelEdit} style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: 16 }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                      <button
                        disabled={selectedQIndex === 0}
                        onClick={() => setSelectedQIndex(idx => Math.max(0, idx - 1))}
                      >
                        Previous
                      </button>
                      <button
                        disabled={selectedQIndex === questions.length - 1}
                        onClick={() => setSelectedQIndex(idx => Math.min(questions.length - 1, idx + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Results Placeholder Modal/Section */}
      {showResultsFor && (
        <div style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: 16, padding: 32, maxWidth: 600, margin: '32px auto', boxShadow: '0 4px 24px #0002', position: 'relative' }}>
          <button onClick={() => setShowResultsFor(null)} style={{ position: 'absolute', top: 12, right: 18, fontSize: 22, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>&times;</button>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginBottom: 18 }}>Test Results (Placeholder)</h3>
          <div style={{ marginBottom: 12 }}><b>Total Score Available:</b> <span style={{ color: '#2563eb' }}>[total score placeholder]</span></div>
          <div style={{ marginBottom: 12 }}><b>Student Attendance:</b> <span style={{ color: '#2563eb' }}>[attendance placeholder]</span></div>
          <div style={{ marginBottom: 12 }}><b>Student Scores:</b> <span style={{ color: '#2563eb' }}>[scores placeholder]</span></div>
          <div style={{ marginBottom: 12 }}><b>Student Rankings:</b> <span style={{ color: '#2563eb' }}>[rankings placeholder]</span></div>
          <div style={{ marginBottom: 12 }}><b>Question Correctness Distribution:</b>
            <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, marginTop: 6 }}>[distribution chart placeholder]</div>
          </div>
        </div>
      )}
      {/* Invite Students Placeholder Modal/Section */}
      {showInviteFor && (
        <div style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: 16, padding: 32, maxWidth: 500, margin: '32px auto', boxShadow: '0 4px 24px #0002', position: 'relative' }}>
          <button onClick={() => setShowInviteFor(null)} style={{ position: 'absolute', top: 12, right: 18, fontSize: 22, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>&times;</button>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginBottom: 18 }}>Invite Students (Placeholder)</h3>
          <div style={{ marginBottom: 12 }}>[invite students feature coming soon]</div>
        </div>
      )}
      {showStudentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(30, 41, 59, 0.45)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 40,
            maxWidth: 900,
            width: '98vw',
            maxHeight: '98vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px #2563eb22',
            position: 'relative',
            border: 'none',
            margin: 0,
          }}>
            <button onClick={() => setShowStudentsModal(false)} style={{ position: 'absolute', top: 18, right: 28, fontSize: 28, background: 'none', border: 'none', color: '#888', cursor: 'pointer', zIndex: 10 }}>&times;</button>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginBottom: 20, textAlign: 'center' }}>All Students under you</h3>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={studentsSearch}
              onChange={e => { setStudentsSearch(e.target.value); setStudentsPage(1); }}
              style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
            />
            {studentsLoading ? (
              <div>Loading...</div>
            ) : studentsError ? (
              <div style={{ color: '#dc2626' }}>{studentsError}</div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f3f6fd' }}>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Grade</th>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Email</th>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Account State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((s, idx) => (
                      <tr key={s.email || idx}>
                        <td style={{ padding: 8 }}>{s.name || '-'}</td>
                        <td style={{ padding: 8 }}>{s.grade || '-'}</td>
                        <td style={{ padding: 8 }}>{s.email}</td>
                        <td style={{ padding: 8 }}>{s.account_state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination controls */}
                {totalStudentPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                    <button
                      className="btn btn-outline"
                      style={{ minWidth: 36, fontSize: 15, borderRadius: 8, padding: '4px 12px' }}
                      onClick={() => setStudentsPage(p => Math.max(1, p - 1))}
                      disabled={studentsPage === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalStudentPages }, (_, i) => (
                      <button
                        key={i + 1}
                        className="btn btn-outline"
                        style={{ minWidth: 32, fontWeight: studentsPage === i + 1 ? 700 : 400, color: studentsPage === i + 1 ? '#2563eb' : undefined, borderColor: studentsPage === i + 1 ? '#2563eb' : undefined, fontSize: 15, borderRadius: 8, padding: '4px 10px' }}
                        onClick={() => setStudentsPage(i + 1)}
                        disabled={studentsPage === i + 1}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="btn btn-outline"
                      style={{ minWidth: 36, fontSize: 15, borderRadius: 8, padding: '4px 12px' }}
                      onClick={() => setStudentsPage(p => Math.min(totalStudentPages, p + 1))}
                      disabled={studentsPage === totalStudentPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            <button className="btn btn-outline mt-4" onClick={() => { fetchStudentsList(); setStudentsPage(1); }} disabled={studentsLoading} style={{ width: '100%', fontSize: 16, marginTop: 24, borderRadius: 12 }}>
              {studentsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(30, 41, 59, 0.45)',
          zIndex: 2100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 32,
            maxWidth: 600,
            width: '96vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px #2563eb22',
            position: 'relative',
            border: 'none',
            margin: 0,
          }}>
            <button onClick={() => setShowInviteModal(false)} style={{ position: 'absolute', top: 16, right: 24, fontSize: 24, background: 'none', border: 'none', color: '#888', cursor: 'pointer', zIndex: 10 }}>&times;</button>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginBottom: 18, textAlign: 'center' }}>Invite Students</h3>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={inviteSearch}
              onChange={e => { setInviteSearch(e.target.value); setInvitePage(1); }}
              style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
            />
            {inviteLoading ? (
              <div>Loading...</div>
            ) : inviteError ? (
              <div style={{ color: '#dc2626' }}>{inviteError}</div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 16 }}>
                    <input
                      type="checkbox"
                      checked={selectAllInvite}
                      onChange={handleSelectAllInvite}
                      style={{ marginRight: 8 }}
                    />
                    Select All
                  </label>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f3f6fd' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}></th>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInviteStudents.map((s, idx) => (
                      <tr key={s.email || idx}>
                        <td style={{ padding: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedInviteStudents.includes(s.email)}
                            onChange={() => handleSelectInviteStudent(s.email)}
                          />
                        </td>
                        <td style={{ padding: 8 }}>{s.name || '-'}</td>
                        <td style={{ padding: 8 }}>{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination controls */}
                {totalInvitePages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                    <button
                      className="btn btn-outline"
                      style={{ minWidth: 36, fontSize: 15, borderRadius: 8, padding: '4px 12px' }}
                      onClick={() => setInvitePage(p => Math.max(1, p - 1))}
                      disabled={invitePage === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalInvitePages }, (_, i) => (
                      <button
                        key={i + 1}
                        className="btn btn-outline"
                        style={{ minWidth: 32, fontWeight: invitePage === i + 1 ? 700 : 400, color: invitePage === i + 1 ? '#2563eb' : undefined, borderColor: invitePage === i + 1 ? '#2563eb' : undefined, fontSize: 15, borderRadius: 8, padding: '4px 10px' }}
                        onClick={() => setInvitePage(i + 1)}
                        disabled={invitePage === i + 1}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="btn btn-outline"
                      style={{ minWidth: 36, fontSize: 15, borderRadius: 8, padding: '4px 12px' }}
                      onClick={() => setInvitePage(p => Math.min(totalInvitePages, p + 1))}
                      disabled={invitePage === totalInvitePages}
                    >
                      Next
                    </button>
                  </div>
                )}
                <button
                  className="btn btn-primary mt-4"
                  onClick={handleInviteSelected}
                  disabled={inviteLoading || selectedInviteStudents.length === 0}
                  style={{ width: '100%', fontSize: 18, marginTop: 24, borderRadius: 10 }}
                >
                  {inviteLoading ? 'Inviting...' : 'Invite Selected'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showTestInviteModal && selectedTestForInvite && (
        <TestInviteModal
          isOpen={showTestInviteModal}
          onClose={() => {
            setShowTestInviteModal(false);
            setSelectedTestForInvite(null);
          }}
          onInvite={handleInviteSuccess}
          test={selectedTestForInvite}
          testId={selectedTestForInvite?.id}
        />
      )}
      {showDuplicateDialog && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Duplicate Invites Detected</h3>
            <p>The following student(s) are already invited to this test:</p>
            <ul>
              {duplicateInvites.map((email) => (
                <li key={email} style={{ marginBottom: 4 }}>{email}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDuplicateDialog(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;