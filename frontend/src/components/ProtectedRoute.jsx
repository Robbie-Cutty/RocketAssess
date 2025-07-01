import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import sessionManager from '../utils/sessionManager';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        // First check if this session is valid
        if (!sessionManager.isLoggedIn()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if session has expired
        if (sessionManager.isSessionExpired()) {
          sessionManager.clearSession();
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Get authentication data from session manager
        const authData = sessionManager.getAuthData();
        if (!authData) {
          sessionManager.clearSession();
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const { email, user_type: currentRole } = authData;
        setUserRole(currentRole);

        // Check if role is required and matches
        if (requiredRole && currentRole !== requiredRole) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Make server-side verification call
        const response = await fetch('/api/verify-auth/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({
            email: email,
            user_type: currentRole
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Refresh session timestamp on successful verification
          sessionManager.refreshSession();
          setIsAuthenticated(true);
        } else {
          // Clear session and all authentication data
          sessionManager.clearSession();
          localStorage.removeItem('student_name');
          localStorage.removeItem('student_email');
          localStorage.removeItem('teacher_name');
          localStorage.removeItem('teacher_pk');
          Cookies.remove('teacher_name');
          Cookies.remove('org_name');
          Cookies.remove('token');
          Cookies.remove('user_email');
          Cookies.remove('teacher_id');
          Cookies.remove('teacher_pk');
          Cookies.remove('org_code');
          setIsAuthenticated(false);
        }
      } catch (error) {
        sessionManager.clearSession();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthentication();
  }, [requiredRole, location.pathname]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role-based routing logic
  if (userRole && !requiredRole) {
    const currentPath = location.pathname;
    
    // If user is a student and trying to access teacher routes, redirect to student dashboard
    if (userRole === 'student' && (
      currentPath.startsWith('/teacher-dashboard') ||
      currentPath.startsWith('/create-test') ||
      currentPath.startsWith('/question-pool') ||
      currentPath.startsWith('/invite-students') ||
      currentPath.startsWith('/invited-students')
    )) {
      // Show a brief message before redirecting
      setTimeout(() => {
        alert('Access denied. You are logged in as a student. Redirecting to Student Dashboard.');
      }, 100);
      return <Navigate to="/student-dashboard" replace />;
    }
    
    // If user is a teacher and trying to access student routes, redirect to teacher dashboard
    if (userRole === 'teacher' && (
      currentPath.startsWith('/student-dashboard')
    )) {
      // Show a brief message before redirecting
      setTimeout(() => {
        alert('Access denied. You are logged in as a teacher. Redirecting to Teacher Dashboard.');
      }, 100);
      return <Navigate to="/teacher-dashboard" replace />;
    }
    
    // If user is an organization and trying to access teacher/student routes, redirect to org profile
    if (userRole === 'organization' && (
      currentPath.startsWith('/teacher-dashboard') ||
      currentPath.startsWith('/student-dashboard') ||
      currentPath.startsWith('/create-test') ||
      currentPath.startsWith('/question-pool') ||
      currentPath.startsWith('/invite-students') ||
      currentPath.startsWith('/invited-students')
    )) {
      // Show a brief message before redirecting
      setTimeout(() => {
        alert('Access denied. You are logged in as an organization. Redirecting to Organization Profile.');
      }, 100);
      return <Navigate to="/org-profile" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
