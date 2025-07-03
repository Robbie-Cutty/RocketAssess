import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://192.168.1.71:8000',
  withCredentials: true, // Keep if you need cookies for auth, else remove
});

// Add request interceptor to automatically include authentication data
api.interceptors.request.use(
  (config) => {
    // Get authentication data from client storage
    const studentName = localStorage.getItem('student_name');
    const teacherName = Cookies.get('teacher_name');
    const orgName = Cookies.get('org_name');
    const userEmail = Cookies.get('user_email');

    // Determine user type and add to request
    if (studentName && localStorage.getItem('student_email')) {
      config.headers['X-User-Email'] = localStorage.getItem('student_email');
      config.headers['X-User-Type'] = 'student';
    } else if (teacherName) {
      // Try to get teacher email from cookies
      let teacherEmail = Cookies.get('user_email') || Cookies.get('teacher_email');
      if (!teacherEmail) {
        // Fallback: use teacher_pk as a last resort (not ideal, but better than missing header)
        teacherEmail = Cookies.get('teacher_pk') || '';
      }
      config.headers['X-User-Email'] = teacherEmail;
      config.headers['X-User-Type'] = 'teacher';
    } else if (orgName && userEmail) {
      config.headers['X-User-Email'] = userEmail;
      config.headers['X-User-Type'] = 'organization';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle duplicate errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 409 &&
      error.response.data &&
      error.response.data.duplicates
    ) {
      // Throw a custom error for duplicate invites
      return Promise.reject({
        isDuplicateInvite: true,
        duplicates: error.response.data.duplicates,
        error: error.response.data.error || 'Duplicate invite(s) detected.'
      });
    }
    // Rethrow all other errors
    return Promise.reject(error);
  }
);

export default api; 