import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TeacherRegister from './pages/TeacherRegister.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import CreateTest from './pages/CreateTest.jsx';
import Header from './components/Header.jsx';
import Profile from './pages/Profile';
import OrgProfile from './pages/OrgProfile';
import ResultsPage from './pages/ResultsPage';
import InviteStudentsPage from './pages/InviteStudentsPage.jsx';
import StudentRegister from './pages/StudentRegister.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import InvitedStudentsList from './pages/InvitedStudentsList.jsx';
import TestRoom from './pages/TestRoom.jsx';
import TestReview from './pages/TestReview';
import TestResults from './pages/TestResults';
import TestRedirect from './pages/TestRedirect.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-register" element={<StudentRegister />} />
          <Route path="/test-redirect" element={<TestRedirect />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="organization">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/teacher-register" element={<TeacherRegister />} />
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-test" element={
            <ProtectedRoute requiredRole="teacher">
              <CreateTest />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/org-profile" element={
            <ProtectedRoute requiredRole="organization">
              <OrgProfile />
            </ProtectedRoute>
          } />
          <Route path="/test/:testId/results" element={
            <ProtectedRoute requiredRole="organization">
              <ResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/invite-students" element={
            <ProtectedRoute requiredRole="teacher">
              <InviteStudentsPage />
            </ProtectedRoute>
          } />
          <Route path="/student-dashboard" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/invited-students" element={
            <ProtectedRoute requiredRole="teacher">
              <InvitedStudentsList />
            </ProtectedRoute>
          } />
          <Route path="/test/:testId" element={
            <ProtectedRoute requiredRole="student">
              <TestRoom />
            </ProtectedRoute>
          } />
          <Route path="/review/:submissionId" element={
            <ProtectedRoute requiredRole="teacher">
              <TestReview />
            </ProtectedRoute>
          } />
          <Route path="/test-results/:testId" element={
            <ProtectedRoute requiredRole="teacher">
              <TestResults />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
