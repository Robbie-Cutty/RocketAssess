import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/axios';

const QUESTIONS_PER_PAGE = 3;

const QuestionPool = ({ testId, onAdd, addedQuestionIds }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const teacherId = Cookies.get('teacher_pk');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/question-pool/?teacher_id=${teacherId}`);
        if (res.status === 200) {
          const data = res.data;
          if (Array.isArray(data)) {
            setQuestions(data);
          } else if (Array.isArray(data.results)) {
            setQuestions(data.results);
          } else {
            setQuestions([]);
          }
        } else {
          setError('Failed to fetch question pool.');
        }
      } catch {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [teacherId]);

  const toggleSelect = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(qid => qid !== id) : [...sel, id]);
  };
  const selectAll = () => setSelected(paginatedQuestions.map(q => q.id));
  const deselectAll = () => setSelected([]);
  const addAllSelected = () => {
    questions.filter(q => selected.includes(q.id) && !addedQuestionIds.includes(q.id)).forEach(q => onAdd(q));
    setSelected([]);
  };

  // Pagination logic
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = questions.slice((page - 1) * QUESTIONS_PER_PAGE, page * QUESTIONS_PER_PAGE);

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold mb-2 text-primary">Question Pool</h3>
      <div className="sticky top-0 z-10 bg-white py-2 flex flex-wrap gap-2 items-center border-b mb-3">
        <button className="btn btn-xs btn-outline" onClick={selectAll}>Select All</button>
        <button className="btn btn-xs btn-outline" onClick={deselectAll}>Deselect All</button>
        <button className="btn btn-xs btn-primary" onClick={addAllSelected} disabled={selected.length === 0}>Add All Selected</button>
        <span className="ml-2 text-sm text-gray-500">{selected.length} selected</span>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : Array.isArray(questions) && questions.length === 0 ? (
        <p className="text-secondary">No questions in your pool yet.</p>
      ) : (
        <>
          <div className="question-pool-grid">
            {paginatedQuestions.map(q => (
              <div key={q.id} className={`qp-card ${selected.includes(q.id) ? 'qp-card-selected' : ''}`}>
                <input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggleSelect(q.id)} className="qp-checkbox" />
                <div className="qp-card-content">
                  <div className="qp-question-text">{q.text}</div>
                  <div className="qp-choices-area">
                    <div className="qp-choice"><span className="qp-choice-label">A:</span> {q.option_a}</div>
                    <div className="qp-choice"><span className="qp-choice-label">B:</span> {q.option_b}</div>
                    <div className="qp-choice"><span className="qp-choice-label">C:</span> {q.option_c}</div>
                    <div className="qp-choice"><span className="qp-choice-label">D:</span> {q.option_d}</div>
                  </div>
                  <div className="qp-badges-row">
                    <span className="qp-badge qp-badge-green">Correct: {q.correct_answer}</span>
                    <span className="qp-badge qp-badge-blue">Points: {q.point_value}</span>
                  </div>
                </div>
                <button
                  className={`btn btn-sm qp-add-btn ${addedQuestionIds.includes(q.id) ? 'btn-disabled' : 'btn-primary'}`}
                  disabled={addedQuestionIds.includes(q.id)}
                  onClick={() => onAdd(q)}
                >
                  Add to Test
                </button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button className="btn btn-xs btn-outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>&larr; Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`btn btn-xs ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => goToPage(i + 1)}
                  disabled={page === i + 1}
                  style={{ minWidth: 32 }}
                >
                  {i + 1}
                </button>
              ))}
              <button className="btn btn-xs btn-outline" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>Next &rarr;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionPool;
