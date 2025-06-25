import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/axios';

const QuestionPool = ({ testId, onAdd, addedQuestionIds }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold mb-2 text-primary">Question Pool</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : Array.isArray(questions) && questions.length === 0 ? (
        <p className="text-secondary">No questions in your pool yet.</p>
      ) : (
        <ul className="mb-2 divide-y divide-gray-200">
          {Array.isArray(questions) && questions.map(q => (
            <li key={q.id} className="flex items-center justify-between w-full py-2 px-1">
              <div>
                <div className="font-medium">{q.text}</div>
                <div className="text-xs text-gray-500">A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}</div>
                <div className="text-xs text-success">Correct: {q.correct_answer} | Points: {q.point_value}</div>
              </div>
              <button
                className="btn btn-xs btn-outline ml-4"
                disabled={addedQuestionIds.includes(q.id)}
                onClick={() => onAdd(q)}
              >
                {addedQuestionIds.includes(q.id) ? 'Added' : 'Add to Test'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QuestionPool;
