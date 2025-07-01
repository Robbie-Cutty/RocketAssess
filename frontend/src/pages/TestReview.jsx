import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axios';
import Cookies from 'js-cookie';

const TestReview = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [current, setCurrent] = useState(0);

  const fromResults = location.state && location.state.fromResults;
  const testId = location.state && location.state.testId;
  const scheduledStart = location.state && location.state.scheduled_start;
  const scheduledEnd = location.state && location.state.scheduled_end;
  const scheduledDuration = location.state && location.state.scheduled_duration;

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        const teacherName = Cookies.get('teacher_name');
        if (teacherName) {
          // Teacher: can view any submission
          const res = await api.get(`/api/submission-detail/${submissionId}/?role=teacher`);
          if (res.status === 200) {
            setSubmission(res.data);
          } else {
            setError('Failed to fetch submission details.');
          }
        } else {
          // Student: can only view their own
          const studentEmail = localStorage.getItem('student_email');
          if (!studentEmail) {
            setError('Student email not found. Please log in again.');
            setLoading(false);
            return;
          }
          const res = await api.get(`/api/submission-detail/${submissionId}/?role=student&email=${encodeURIComponent(studentEmail)}`);
          if (res.status === 200) {
            setSubmission(res.data);
          } else {
            setError('Failed to fetch submission details.');
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('Access denied. You can only view your own submissions.');
        } else {
          setError('Network error.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [submissionId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center' }}>{error}</div>;
  if (!submission) return null;

  const questions = submission.questions;
  const q = questions[current];
  const student = submission.student;

  // Pagination UI for questions
  const renderPagination = () => {
    const total = questions.length;
    const maxButtons = 5;
    let pages = [];
    if (total <= maxButtons) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      if (current < 3) {
        pages = [0, 1, 2, '...', total - 1];
      } else if (current > total - 4) {
        pages = [0, '...', total - 3, total - 2, total - 1];
      } else {
        pages = [0, '...', current - 1, current, current + 1, '...', total - 1];
      }
    }
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0' }}>
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            width: 48, height: 48, borderRadius: 12, border: 'none', background: '#f3f4f6', fontSize: 22, color: '#222', cursor: current === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          &#60;
        </button>
        {pages.map((p, idx) =>
          p === '...'
            ? <div key={idx} style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#888' }}>...</div>
            : <button
                key={p}
                onClick={() => setCurrent(p)}
                style={{
                  width: 48, height: 48, borderRadius: 12, border: 'none',
                  background: current === p ? '#3b82f6' : '#fff',
                  color: current === p ? '#fff' : '#222',
                  fontWeight: 600, fontSize: 22, boxShadow: '0 1px 4px #0001', cursor: 'pointer',
                }}
              >
                {p + 1}
              </button>
        )}
        <button
          onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
          disabled={current === questions.length - 1}
          style={{
            width: 48, height: 48, borderRadius: 12, border: 'none', background: '#f3f4f6', fontSize: 22, color: '#222', cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          &#62;
        </button>
      </div>
    );
  };

  // Helper to format duration as min:sec
  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s.toString().padStart(2, '0')} sec`;
  };

  // Helper to estimate entered_at if missing
  const getEnteredAt = (submission) => {
    if (submission.entered_at) return { value: new Date(submission.entered_at), estimated: false };
    if (submission.submitted_at && typeof submission.duration === 'number') {
      const entered = new Date(new Date(submission.submitted_at).getTime() - submission.duration * 1000);
      return { value: entered, estimated: true };
    }
    return { value: null, estimated: false };
  };

  const enteredAtInfo = getEnteredAt(submission);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light">
      <div className="card max-w-2xl w-full" style={{ margin: '40px auto', padding: 32 }}>
        <h2 className="text-2xl font-bold mb-2 text-primary">{submission.test.title}</h2>
        {student && (
          <div style={{ fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>
            Submission by: {student.name} <span style={{ color: '#64748b', fontWeight: 400 }}>({student.email})</span>
          </div>
        )}
        <div className="mb-2 text-secondary">{submission.test.subject} &middot; {submission.test.description}</div>
        <div style={{
          background: '#f8fafc',
          borderRadius: 10,
          padding: 24,
          margin: '0 0 24px 0',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 22
        }}>
          Time in Test<br />
          <span style={{ fontWeight: 600, fontSize: 20 }}>
            Entered: {enteredAtInfo.value ? enteredAtInfo.value.toLocaleString() : '-'}
            {enteredAtInfo.estimated && <span style={{ color: '#f59e42', fontWeight: 400 }}> (estimated)</span>}<br />
            End: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '-'}<br />
            Duration: {formatDuration(submission.duration)}
          </span>
        </div>
        {scheduledStart && (
          <div style={{ marginBottom: 18, background: '#f3f4f6', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>Scheduled Test Window</div>
            <div><b>Start:</b> {new Date(scheduledStart).toLocaleString()}</div>
            <div><b>End:</b> {scheduledEnd ? new Date(scheduledEnd).toLocaleString() : '-'}</div>
            <div><b>Duration:</b> {scheduledDuration ? scheduledDuration + ' min' : '-'}</div>
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 24, padding: 18, borderRadius: 10, background: q.is_correct ? '#e0fbe0' : '#fee2e2', border: q.is_correct ? '1px solid #16a34a' : '1px solid #dc2626' }}>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Q{current + 1} of {questions.length}: {q.text}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} style={{
                  fontWeight: q.correct_answer === opt ? 700 : 400,
                  color: q.correct_answer === opt ? '#16a34a' : (q.selected_answer === opt ? '#dc2626' : '#222'),
                  background: q.selected_answer === opt ? '#f3f4f6' : 'transparent',
                  borderRadius: 6,
                  padding: '2px 8px',
                }}>
                  {opt}. {q[`option_${opt.toLowerCase()}`]}
                  {q.correct_answer === opt && <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 700 }}>(Correct)</span>}
                  {q.selected_answer === opt && q.selected_answer !== q.correct_answer && <span style={{ marginLeft: 8, color: '#dc2626' }}>(Your Answer)</span>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 15 }}>
              {q.is_correct ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Correct</span> : <span style={{ color: '#dc2626', fontWeight: 600 }}>Incorrect</span>}
            </div>
          </div>
          {renderPagination()}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (fromResults && testId) {
              navigate(`/test-results/${testId}`);
            } else {
              navigate('/student-dashboard');
            }
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TestReview; 