// Session management utility for secure authentication
// Uses sessionStorage to ensure new windows/tabs require re-authentication
// But allows cross-tab logout communication

class SessionManager {
  constructor() {
    this.SESSION_KEY = 'rocket_assess_session';
    this.initializeSession();
  }

  // Initialize session tracking
  initializeSession() {
    // Generate a unique session ID for this tab/window
    if (!sessionStorage.getItem(this.SESSION_KEY)) {
      const sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
  }

  // Generate a unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get current session ID
  getSessionId() {
    return sessionStorage.getItem(this.SESSION_KEY);
  }

  // Check if current session is valid (for this tab only)
  isSessionValid() {
    const sessionId = this.getSessionId();
    const isLoggedIn = this.hasValidAuthData();
    return sessionId && isLoggedIn;
  }

  // Check if user has valid authentication data (shared across tabs)
  hasValidAuthData() {
    const studentName = localStorage.getItem('student_name');
    const teacherName = this.getCookie('teacher_name');
    const orgName = this.getCookie('org_name');
    
    // Only log if we're debugging
    if (window.location.search.includes('debug=true')) {
      console.log('SessionManager: Checking auth data...');
      console.log('- Student name:', studentName);
      console.log('- Teacher name:', teacherName);
      console.log('- Org name:', orgName);
    }
    
    const hasAuth = !!(studentName || teacherName || orgName);
    return hasAuth;
  }

  // Set user as logged in for this session only
  setLoggedIn(userType, userData) {
    console.log('SessionManager: Setting logged in for:', userType, userData?.name || userData?.email);
    
    const sessionId = this.getSessionId();
    if (!sessionId) {
      this.initializeSession();
    }
    
    // Store session authentication flag (tab-specific)
    sessionStorage.setItem(`${this.SESSION_KEY}_auth`, 'true');
    sessionStorage.setItem(`${this.SESSION_KEY}_user_type`, userType);
    sessionStorage.setItem(`${this.SESSION_KEY}_timestamp`, Date.now().toString());
  }

  // Check if user is logged in for this session (tab-specific)
  isLoggedIn() {
    const sessionAuth = sessionStorage.getItem(`${this.SESSION_KEY}_auth`);
    const sessionId = this.getSessionId();
    const hasAuthData = this.hasValidAuthData();
    
    return sessionAuth === 'true' && sessionId && hasAuthData;
  }

  // Get user type for current session
  getUserType() {
    if (!this.isLoggedIn()) return null;
    return sessionStorage.getItem(`${this.SESSION_KEY}_user_type`);
  }

  // Clear session (logout) - only clears this tab's session data
  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(`${this.SESSION_KEY}_auth`);
    sessionStorage.removeItem(`${this.SESSION_KEY}_user_type`);
    sessionStorage.removeItem(`${this.SESSION_KEY}_timestamp`);
  }

  // Clear all authentication data (for complete logout across all tabs)
  clearAllAuthData() {
    // Clear session data for this tab
    this.clearSession();
    
    // Clear shared authentication data (cookies and localStorage)
    localStorage.removeItem('student_name');
    localStorage.removeItem('student_email');
    localStorage.removeItem('teacher_name');
    localStorage.removeItem('teacher_pk');
    
    // Clear cookies
    document.cookie = 'teacher_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'org_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'teacher_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'teacher_pk=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'org_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Get authentication data for API calls
  getAuthData() {
    if (!this.isLoggedIn()) return null;

    const userType = this.getUserType();
    let email = null;

    if (userType === 'student') {
      email = localStorage.getItem('student_email');
    } else if (userType === 'teacher') {
      email = this.getCookie('user_email');
    } else if (userType === 'organization') {
      email = this.getCookie('user_email');
    }

    return email ? { email, user_type: userType } : null;
  }

  // Helper method to get cookie value
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Check session validity with timestamp (optional: add session timeout)
  isSessionExpired(timeoutMinutes = 480) { // 8 hours default
    const timestamp = sessionStorage.getItem(`${this.SESSION_KEY}_timestamp`);
    if (!timestamp) return true;
    
    const sessionTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    return (currentTime - sessionTime) > timeoutMs;
  }

  // Refresh session timestamp
  refreshSession() {
    if (this.isLoggedIn()) {
      sessionStorage.setItem(`${this.SESSION_KEY}_timestamp`, Date.now().toString());
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager; 