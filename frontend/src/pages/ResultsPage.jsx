import React from 'react';
import { useParams } from 'react-router-dom';

const ResultsPage = () => {
  const { testId } = useParams();
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 24 }}>Test Results (Placeholder)</h2>
      <div style={{ marginBottom: 18 }}><b>Test ID:</b> {testId}</div>
      <div style={{ marginBottom: 18 }}><b>Total Score Available:</b> <span style={{ color: '#2563eb' }}>[total score placeholder]</span></div>
      <div style={{ marginBottom: 18 }}><b>Student Attendance:</b> <span style={{ color: '#2563eb' }}>[attendance placeholder]</span></div>
      <div style={{ marginBottom: 18 }}><b>Student Scores:</b> <span style={{ color: '#2563eb' }}>[scores placeholder]</span></div>
      <div style={{ marginBottom: 18 }}><b>Student Rankings:</b> <span style={{ color: '#2563eb' }}>[rankings placeholder]</span></div>
      <div style={{ marginBottom: 18 }}><b>Question Correctness Distribution:</b>
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, marginTop: 6 }}>[distribution chart placeholder]</div>
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

export default ResultsPage; 