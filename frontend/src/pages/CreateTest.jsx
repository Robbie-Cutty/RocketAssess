import React, { useState } from 'react';
import '../styles/globals.css';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import QuestionPool from './QuestionPool';
import api from '../utils/axios';

const initialQuestion = {
  text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  point_value: 1,
};

const teacherId = Cookies.get('teacher_pk');

const CreateTest = () => {
  const [form, setForm] = useState({ name: '', subject: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testId, setTestId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState(initialQuestion);
  const [qError, setQError] = useState('');
  const [qLoading, setQLoading] = useState(false);
  const [qSuccess, setQSuccess] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  // Test creation handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess('');
    
    if (!form.name.trim()) {
      setError('Test name is required.');
      setLoading(false);
      return;
    }
    
    if (!teacherId) {
      setError('Teacher ID not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.post('/api/test-create/', { 
        ...form, 
        teacher: teacherId,
        name: form.name.trim(),
        subject: form.subject.trim(),
        description: form.description.trim()
      });
      
      if (res.status === 201 && res.data) {
        setTestId(res.data.id);
        setSuccess(true);
      } else {
        const data = res.data || {};
        setError(data?.error || 'Failed to create test.');
      }
    } catch (err) {
      console.error('Create test error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Question creation handlers
  const handleQChange = (e) => {
    setQForm({ ...qForm, [e.target.name]: e.target.value });
    setQError('');
    setQSuccess('');
  };

  // Edit question handler
  const handleEdit = (q, idx) => {
    setQForm(q);
    setEditingIndex(idx);
    setEditingId(q.id);
    setQError('');
    setQSuccess('');
  };

  // Delete question handler
  const handleDelete = async (q, idx) => {
    setQError('');
    setQSuccess('');
    // If question has an id, delete from backend
    if (q.id) {
      try {
        const res = await api.delete(`/api/question-delete/${q.id}/`);
        if (!res.ok) {
          setQError('Failed to delete question.');
          return;
        }
      } catch {
        setQError('Network error.');
        return;
      }
    }
    // Remove from local state
    setQuestions(questions.filter((_, i) => i !== idx));
    setQSuccess('Question deleted.');
    // If editing this question, reset form
    if (editingIndex === idx) {
      setQForm(initialQuestion);
      setEditingIndex(null);
      setEditingId(null);
    }
  };

  // Update handleQSubmit to support editing
  const handleQSubmit = async (e) => {
    e.preventDefault();
    setQError('');
    setQSuccess('');
    
    if (!qForm.text.trim() || !qForm.option_a.trim() || !qForm.option_b.trim() || !qForm.option_c.trim() || !qForm.option_d.trim()) {
      setQError('All fields are required.');
      return;
    }
    
    if (!['A','B','C','D'].includes(qForm.correct_answer)) {
      setQError('Correct answer must be A, B, C, or D.');
      return;
    }
    
    if (!qForm.point_value || isNaN(qForm.point_value) || qForm.point_value < 1) {
      setQError('Point value must be a positive number.');
      return;
    }
    
    if (!testId) {
      setQError('Test ID not found. Please create the test first.');
      return;
    }
    
    setQLoading(true);
    try {
      if (editingId) {
        // Update existing question
        const res = await api.patch(`/api/question-update/${editingId}/`, { 
          ...qForm, 
          test: testId,
          text: qForm.text.trim(),
          option_a: qForm.option_a.trim(),
          option_b: qForm.option_b.trim(),
          option_c: qForm.option_c.trim(),
          option_d: qForm.option_d.trim()
        });
        
        if (res.status === 200 && res.data) {
          const updated = res.data;
          setQuestions(questions.map((q, i) => i === editingIndex ? updated : q));
          setQSuccess('Question updated!');
          setQForm(initialQuestion);
        } else {
          const data = res.data || {};
          setQError(data?.error || 'Failed to update question.');
        }
        setEditingIndex(null);
        setEditingId(null);
      } else {
        // Create new question
        const res = await api.post('/api/question-create/', { 
          ...qForm, 
          test: testId,
          text: qForm.text.trim(),
          option_a: qForm.option_a.trim(),
          option_b: qForm.option_b.trim(),
          option_c: qForm.option_c.trim(),
          option_d: qForm.option_d.trim()
        });
        
        if (res.status === 201 && res.data) {
          setQuestions([...questions, res.data]);
          setQForm(initialQuestion);
          setQSuccess('Question added!');
        } else {
          const data = res.data || {};
          setQError(data?.error || 'Failed to add question.');
        }
      }
    } catch (err) {
      console.error('Question submit error:', err);
      setQError('Network error. Please try again.');
    } finally {
      setQLoading(false);
    }
  };

  // Add question from pool to test
  const handleAddFromPool = async (q) => {
    setQError('');
    setQSuccess('');
    setQLoading(true);
    try {
      const res = await fetch('/api/question-create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: q.text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          point_value: q.point_value,
          test: testId,
        }),
      });
      if (res.ok) {
        setQuestions([...questions, q]);
        setQSuccess('Question added from pool!');
      } else {
        const data = await res.json().catch(() => ({}));
        setQError(data?.error || 'Failed to add question from pool.');
      }
    } catch {
      setQError('Network error. Please try again.');
    } finally {
      setQLoading(false);
    }
  };

  // Finish handler
  const handleFinish = () => {
    navigate('/teacher-dashboard');
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <h2 style={{ color: '#22c55e', marginBottom: 24 }}>Test created successfully!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/teacher-dashboard')}>
          Back to Test List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light">
      <div className="card max-w-md w-full mx-auto mt-8">
        <div className="flex justify-between mb-3">
          <Link to="/teacher-dashboard" className="btn btn-outline btn-sm">&larr; Back to Dashboard</Link>
        </div>
        {!testId ? (
          <>
            <h2 className="text-xl font-bold mb-4 text-primary">Create Test</h2>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label htmlFor="test-name">Test Name *</label>
                <input
                  type="text"
                  id="test-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="test-subject">Subject</label>
                <input
                  type="text"
                  id="test-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="test-desc">Description</label>
                <textarea
                  id="test-desc"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              {error && <div className="alert alert-danger mb-2">{error}</div>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Test'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 text-primary">Add Questions</h2>
            <QuestionPool
              testId={testId}
              onAdd={handleAddFromPool}
              addedQuestionIds={questions.map(q => q.id)}
            />
            <form onSubmit={handleQSubmit} autoComplete="off">
              <div className="form-group">
                <label>Question *</label>
                <input type="text" name="text" value={qForm.text} onChange={handleQChange} required />
              </div>
              <div className="form-group grid grid-cols-2 gap-2">
                <input type="text" name="option_a" placeholder="Option A" value={qForm.option_a} onChange={handleQChange} required />
                <input type="text" name="option_b" placeholder="Option B" value={qForm.option_b} onChange={handleQChange} required />
                <input type="text" name="option_c" placeholder="Option C" value={qForm.option_c} onChange={handleQChange} required />
                <input type="text" name="option_d" placeholder="Option D" value={qForm.option_d} onChange={handleQChange} required />
              </div>
              <div className="form-group">
                <label>Correct Answer</label>
                <select name="correct_answer" value={qForm.correct_answer} onChange={handleQChange}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="form-group">
                <label>Point Value</label>
                <input type="number" name="point_value" min="1" value={qForm.point_value} onChange={handleQChange} required className="w-20 px-2 py-1 border rounded" />
              </div>
              {qError && <div className="alert alert-danger mb-2">{qError}</div>}
              {qSuccess && <div className="alert alert-success mb-2">{qSuccess}</div>}
              <button type="submit" className="btn btn-primary w-full" disabled={qLoading}>
                {qLoading ? 'Adding...' : 'Add Question'}
              </button>
            </form>
            {questions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Questions Added</h3>
                <ul className="pl-4 mb-4">
                  {questions.map((q, idx) => (
                    <li key={q.id || idx} className="mb-1 flex items-start gap-2">
                      <div className="flex-1">
                        <div><b>Q:</b> {q.text}</div>
                        <div className="text-sm">A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}</div>
                        <div className="text-xs text-success">Correct: {q.correct_answer}</div>
                        <div className="text-xs">Points: {q.point_value}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="btn btn-xs btn-outline" onClick={() => handleEdit(q, idx)}>Edit</button>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(q, idx)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button className="btn btn-outline w-full mt-2" onClick={handleFinish}>
              Finish &amp; Go to Dashboard
            </button>
          </>
        )}
      </div>
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

export default CreateTest; 