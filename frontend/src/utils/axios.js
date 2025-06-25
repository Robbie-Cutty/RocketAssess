import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:8000',
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
      // For students, use localStorage email
      config.headers['X-User-Email'] = localStorage.getItem('student_email');
      config.headers['X-User-Type'] = 'student';
    } else if (teacherName && userEmail) {
      config.headers['X-User-Email'] = userEmail;
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

export default api; 