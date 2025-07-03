import '../styles/globals.css';
import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaHome } from 'react-icons/fa';
import sessionManager from '../utils/sessionManager';

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    greeting: '',
    dashboardLink: '',
    profileLink: '',
    userRole: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const isVerifyingRef = useRef(false); // Use ref instead of state
  
  useEffect(() => {
    const verifyUserStatus = async () => {
      // Prevent multiple simultaneous verification calls
      if (isVerifyingRef.current) {
        return;
      }
      
      isVerifyingRef.current = true;
      
      try {
        // Check if session is valid
        if (!sessionManager.isLoggedIn()) {
          setIsLoggedIn(false);
          setUserInfo({
            greeting: '',
            dashboardLink: '',
            profileLink: '',
            userRole: ''
          });
          setIsLoading(false);
          return;
        }

        // Check if session has expired
        if (sessionManager.isSessionExpired()) {
          sessionManager.clearSession();
          setIsLoggedIn(false);
          setUserInfo({
            greeting: '',
            dashboardLink: '',
            profileLink: '',
            userRole: ''
          });
          setIsLoading(false);
          return;
        }

        // Get authentication data from session manager
        const authData = sessionManager.getAuthData();
        
        if (!authData) {
          sessionManager.clearSession();
          setIsLoggedIn(false);
          setUserInfo({
            greeting: '',
            dashboardLink: '',
            profileLink: '',
            userRole: ''
          });
          setIsLoading(false);
          return;
        }

        const { email, user_type: currentRole } = authData;

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
          const serverData = await response.json();
          
          // User is still logged in
          let greeting = '';
          let dashboardLink = '';
          let profileLink = '';
          let userRole = '';
          
          if (currentRole === 'student') {
            const studentName = localStorage.getItem('student_name');
            greeting = `Welcome, ${studentName}!`;
            dashboardLink = '/student-dashboard';
            profileLink = '/profile';
            userRole = 'Student';
          } else if (currentRole === 'teacher') {
            const teacherName = Cookies.get('teacher_name');
            greeting = `Welcome, ${teacherName}!`;
            dashboardLink = '/teacher-dashboard';
            profileLink = '/profile';
            userRole = 'Teacher';
          } else if (currentRole === 'organization') {
            const orgName = Cookies.get('org_name');
            greeting = `Welcome, ${orgName}!`;
            dashboardLink = '/dashboard';
            profileLink = '/org-profile';
            userRole = 'Organization';
          }

          // Refresh session timestamp
          sessionManager.refreshSession();
          setIsLoggedIn(true);
          setUserInfo({
            greeting,
            dashboardLink,
            profileLink,
            userRole
          });
        } else {
          // User is not logged in, clear all data
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
          
          setIsLoggedIn(false);
          setUserInfo({
            greeting: '',
            dashboardLink: '',
            profileLink: '',
            userRole: ''
          });
        }
      } catch (error) {
        // On error, clear session and data
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
        
        setIsLoggedIn(false);
        setUserInfo({
          greeting: '',
          dashboardLink: '',
          profileLink: '',
          userRole: ''
        });
      } finally {
        setIsLoading(false);
        isVerifyingRef.current = false; // Reset the flag
      }
    };

    // Initial verification
    verifyUserStatus();

    // Listen for storage changes (when login data is set)
    const handleStorageChange = (e) => {
      // Re-verify when relevant storage items change (for login events)
      if (e.key === 'student_name' || e.key === 'student_email' || e.key === 'teacher_name' || e.key === 'teacher_pk') {
        setTimeout(verifyUserStatus, 100); // Small delay to ensure all data is set
      }
    };

    // Listen for custom events (for cookie changes)
    const handleAuthChange = () => {
      setTimeout(verifyUserStatus, 100);
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    // Also listen for focus events (in case of tab switch)
    window.addEventListener('focus', verifyUserStatus);

    // Set up periodic verification every 5 minutes
    const intervalId = setInterval(verifyUserStatus, 5 * 60 * 1000);

    // Cleanup interval and listeners on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('focus', verifyUserStatus);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Get user info for server logout
      const authData = sessionManager.getAuthData();
      
      if (authData) {
        const { email, user_type: userType } = authData;
        const teacherPk = Cookies.get('teacher_pk');
        
        // Call server logout endpoint to invalidate session
        const logoutData = {
          email: email,
          user_type: userType
        };
        
        if (userType === 'teacher' && teacherPk) {
          logoutData.teacher_pk = teacherPk;
        }
        
        await fetch('/api/logout/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(logoutData)
        });
      }
    } catch (error) {
      // Continue with client-side logout even if server call fails
    }
    
    // Clear ONLY this session's data, not the shared authentication data
    sessionManager.clearSession();
    
    // Update state
    setIsLoggedIn(false);
    setUserInfo({
      greeting: '',
      dashboardLink: '',
      profileLink: '',
      userRole: ''
    });
    
    // Clear browser history to prevent back/forward navigation to protected pages
    window.history.replaceState(null, '', '/');
    
    // Add a new history entry for the home page
    window.history.pushState(null, '', '/');
    
    // Prevent navigation to protected pages by intercepting popstate events
    const handlePopState = (event) => {
      // If user tries to navigate back/forward, redirect to home
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
    };
    
    // Add event listener to prevent navigation to protected pages
    window.addEventListener('popstate', handlePopState);
    
    // Clean up the event listener after a delay
    setTimeout(() => {
      window.removeEventListener('popstate', handlePopState);
    }, 5000);
    
    // Force cache refresh and redirect
    navigate('/', { replace: true });
    
    // Force a hard reload to clear any cached content
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Show loading state while verifying authentication
  if (isLoading) {
    return (
      <nav className="header-root">
        <div className="header-container">
          <div className="header-logo">
            <img src="/logo.png" alt="Rocket Assess Logo" className="header-logo-img" />
            <div className="header-brand">Rocket Assess</div>
          </div>
          <div className="header-links">
            <div style={{ opacity: 0.6 }}>Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="header-root">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <img src="/logo.png" alt="Rocket Assess Logo" className="header-logo-img" />
          <div className="header-brand">Rocket Assess</div>
        </div>
        {/* Desktop Navigation */}
        <div className="header-links" style={{ display: isMobileMenuOpen ? 'none' : undefined }}>
          {!isLoggedIn && <Link to="/" className="header-link">Home</Link>}
          {!isLoggedIn && <Link to="/register" className="header-link">Register</Link>}
          {!isLoggedIn && <Link to="/login" className="header-link">Login</Link>}
          {isLoggedIn && (
            <>
              <span className="header-greeting">
                <FaUser style={{ color: '#2563eb' }} /> {userInfo.greeting}
                <span className="header-role">({userInfo.userRole})</span>
              </span>
              <Link to={userInfo.dashboardLink} className="header-link"><FaHome size={14} style={{ marginRight: 4 }} />Dashboard</Link>
              <Link to={userInfo.profileLink} className="header-link"><FaUser size={14} style={{ marginRight: 4 }} />Profile</Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="header-btn"><FaSignOutAlt size={14} />Logout</button>
            </>
          )}
        </div>
        {/* Mobile menu button */}
        <button className="header-mobile-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="header-links" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0 18px 12px 18px', background: 'white', boxShadow: '0 2px 12px #2563eb10' }}>
          {!isLoggedIn && <Link to="/" className="header-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>}
          {!isLoggedIn && <Link to="/register" className="header-link" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>}
          {!isLoggedIn && <Link to="/login" className="header-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>}
          {isLoggedIn && (
            <>
              <span className="header-greeting">
                <FaUser style={{ color: '#2563eb' }} /> {userInfo.greeting}
                <span className="header-role">({userInfo.userRole})</span>
              </span>
              <Link to={userInfo.dashboardLink} className="header-link" onClick={() => setIsMobileMenuOpen(false)}><FaHome size={14} style={{ marginRight: 4 }} />Dashboard</Link>
              <Link to={userInfo.profileLink} className="header-link" onClick={() => setIsMobileMenuOpen(false)}><FaUser size={14} style={{ marginRight: 4 }} />Profile</Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="header-btn"><FaSignOutAlt size={14} />Logout</button>
            </>
          )}
        </div>
      )}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '350px',
            textAlign: 'center',
            boxShadow: '0 2px 12px #2563eb20'
          }}>
            <h3 style={{ marginBottom: 16 }}>Confirm Logout</h3>
            <p style={{ marginBottom: 24 }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)} style={{ minWidth: 80 }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowLogoutConfirm(false); handleLogout(); }} style={{ minWidth: 80 }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
