import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const TestRoom = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const timerRef = useRef();

  // Block refresh and back/forward
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Optional: Warn on tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        alert('Tab switching is not allowed during the test.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [submitted]);

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/test-detail/?test_id=${testId}`);
        if (res.status === 200) {
          setTest(res.data);
        } else {
          setError('Failed to fetch test details.');
        }
      } catch {
        setError('Network error.');
      }
    };

    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/api/question-list/?test_id=${testId}`);
        if (res.status === 200) {
          setQuestions(Array.isArray(res.data) ? res.data : res.data.questions || []);
        } else {
          setError('Failed to fetch questions.');
        }
      } catch {
        setError('Network error while fetching questions.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSubmission = async () => {
      const studentEmail = localStorage.getItem('student_email');
      if (!studentEmail) return;
      try {
        const res = await api.get(`/api/student-completed-tests/?email=${studentEmail}`);
        if (res.status === 200 && Array.isArray(res.data)) {
          const sub = res.data.find(s => s.test_id === parseInt(testId));
          if (sub) {
            setSubmissionId(sub.submission_id);
            if (sub.entered_at) {
              const enteredAt = new Date(sub.entered_at).getTime();
              setStartTime(enteredAt);
              if (test && test.duration_minutes) {
                const elapsed = Math.floor((Date.now() - enteredAt) / 1000);
                const remaining = test.duration_minutes * 60 - elapsed;
                setTimer(remaining > 0 ? remaining : 0);
              }
            }
          }
        }
      } catch {}
    };

    fetchTest().then(fetchQuestions).then(fetchSubmission);
  }, [testId]);

  // Countdown tick every second
  useEffect(() => {
    if (timer === null || submitted) return;
    if (timer <= 0) {
      handleSubmit(true); // auto-submit
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer, submitted]);

  // Wall clock sync every 3 seconds
  useEffect(() => {
    if (startTime && test?.duration_minutes && !submitted) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const left = test.duration_minutes * 60 - elapsed;
        setTimer(left > 0 ? left : 0);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [startTime, test, submitted]);

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => navigate('/student-dashboard'), 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  useEffect(() => {
    if (test && test.end_time) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(test.end_time);
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        setTimer(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [test]);

  const handleSelect = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const handleSubmit = async (auto = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const studentEmail = localStorage.getItem('student_email');
      if (!studentEmail) {
        setError('Student email not found. Please log in again.');
        setSubmitting(false);
        return;
      }
      const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      const submissionData = {
        test_id: parseInt(testId),
        student_email: studentEmail,
        answers: answers,
        duration: duration,
        submission_id: submissionId
      };
      const response = await api.post('/api/submit-test/', submissionData);
      if (response.status === 200) {
        setSubmitted(true);
        localStorage.setItem(`test_${testId}_score`, response.data.score);
      } else {
        setError(response.data.error || 'Failed to submit test.');
      }
    } catch {
      setError('Network error while submitting test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center' }}>{error}</div>;
  if (submitted) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2 style={{ color: '#16a34a', fontSize: 28, fontWeight: 700 }}>Test Submitted!</h2>
      <p>Thank you for completing the test.</p>
      <p>You will be redirected to your dashboard shortly.</p>
      <button className="btn btn-primary" onClick={() => navigate('/student-dashboard')}>Back to Dashboard</button>
    </div>
  );
  if (!test || questions.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>No questions found for this test.</div>;

  const q = questions[current];
  const formatTime = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light">
      <div className="card max-w-lg w-full" style={{ margin: '40px auto', padding: 32 }}>
        <h2 className="text-2xl font-bold mb-2 text-primary">{test.title}</h2>
        <div className="mb-2 text-secondary">{test.subject} &middot; {test.description}</div>
        {timer !== null ? (
          <div style={{ fontWeight: 700, fontSize: 20, color: timer < 60 ? '#dc2626' : '#2563eb', marginBottom: 12 }}>
            Time Left: {formatTime(timer)}
            {test.duration_minutes && test.end_time && (
              <span style={{ color: '#64748b', fontWeight: 400, fontSize: 15, marginLeft: 12 }}>
                (Ends at: {new Date(test.end_time).toLocaleString()})
              </span>
            )}
          </div>
        ) : (
          <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>
            No timer set for this test. Please contact your teacher.
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#64748b' }}>
            Question Navigation
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            justifyContent: 'center',
            maxWidth: '100%'
          }}>
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = index === current;
              
              let buttonStyle = {
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'white'
              };
              
              if (isCurrent) {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb'
                };
              } else if (isAnswered) {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: '#16a34a',
                  borderColor: '#16a34a'
                };
              } else {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626'
                };
              }
              
              return (
                <button
                  key={question.id}
                  style={buttonStyle}
                  onClick={() => setCurrent(index)}
                  title={`Question ${index + 1}${isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
        
        <div style={{ fontWeight: 600, fontSize: 18, margin: '24px 0 12px 0' }}>
          Question {current + 1} of {questions.length}
        </div>
        <div style={{ fontSize: 17, marginBottom: 18 }}>{q.text}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['A', 'B', 'C', 'D'].map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}>
              <input
                type="radio"
                name={`q_${q.id}`}
                value={opt}
                checked={answers[q.id] === opt}
                onChange={() => handleSelect(q.id, opt)}
              />
              {q[`option_${opt.toLowerCase()}`]}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button
            className="btn btn-outline"
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Previous
          </button>
          {current < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRoom;