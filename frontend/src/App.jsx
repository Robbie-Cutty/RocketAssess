import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherRegister from './pages/TeacherRegister';
import StudentRegister from './pages/StudentRegister';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateTest from './pages/CreateTest';
import QuestionPool from './pages/QuestionPool';
import TestRoom from './pages/TestRoom';
import TestResults from './pages/TestResults';
import TestReview from './pages/TestReview';
import ResultsPage from './pages/ResultsPage';
import InviteStudentsPage from './pages/InviteStudentsPage';
import InvitedStudentsList from './pages/InvitedStudentsList';
import OrgProfile from './pages/OrgProfile';
import Profile from './pages/Profile';
import TestRedirect from './pages/TestRedirect';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

// React App for RocketAssess - GitHub Pages Deployment
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/teacher-register" element={<TeacherRegister />} />
              <Route path="/student-register" element={<StudentRegister />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/teacher-dashboard" element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/student-dashboard" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/create-test" element={
                <ProtectedRoute>
                  <CreateTest />
                </ProtectedRoute>
              } />
              
              <Route path="/question-pool" element={
                <ProtectedRoute>
                  <QuestionPool />
                </ProtectedRoute>
              } />
              
              <Route path="/test/:testId" element={
                <ProtectedRoute>
                  <TestRoom />
                </ProtectedRoute>
              } />
              
              <Route path="/test-results/:testId" element={
                <ProtectedRoute>
                  <TestResults />
                </ProtectedRoute>
              } />
              
              <Route path="/review/:submissionId" element={
                <ProtectedRoute>
                  <TestReview />
                </ProtectedRoute>
              } />
              
              <Route path="/results/:testId" element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/invite-students/:testId" element={
                <ProtectedRoute>
                  <InviteStudentsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/invited-students/:testId" element={
                <ProtectedRoute>
                  <InvitedStudentsList />
                </ProtectedRoute>
              } />
              
              <Route path="/org-profile" element={
                <ProtectedRoute>
                  <OrgProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/test-redirect/:inviteCode" element={<TestRedirect />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
