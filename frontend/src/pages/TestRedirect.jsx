import React from 'react';
import { useLocation } from 'react-router-dom';

const TestRedirect = () => {
  const location = useLocation();
  
  return (
    <div className="container">
      <div className="card">
        <h2>Test Redirect Page</h2>
        <p>This page is used to test the redirect functionality.</p>
        <p>Current location: {location.pathname}</p>
        <p>State from redirect: {JSON.stringify(location.state)}</p>
      </div>
    </div>
  );
};

export default TestRedirect; 