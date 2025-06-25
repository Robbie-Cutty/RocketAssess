import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Cookies from 'js-cookie';
import sessionManager from '../utils/sessionManager';

const testimonials = [
  {
    name: 'Jane Doe',
    org: 'Springfield High',
    quote: 'Rocket Assess made online testing a breeze for our teachers and students!'
  },
  {
    name: 'John Smith',
    org: 'Tech Academy',
    quote: 'The analytics and invite system are top-notch. Highly recommended.'
  },
  {
    name: 'Emily Lee',
    org: 'Maple Leaf School',
    quote: 'We love the instant feedback and easy-to-use interface.'
  }
];

const faqs = [
  {
    q: 'Is Rocket Assess free to use?',
    a: 'We offer a free tier for small organizations and affordable plans for larger institutions.'
  },
  {
    q: 'Can I import my own questions?',
    a: 'Yes! You can create, import, and manage your own question pools.'
  },
  {
    q: 'How secure is the platform?',
    a: 'All data is encrypted and access is role-based. We take privacy and security seriously.'
  },
  {
    q: 'Do you support live proctoring?',
    a: 'Live proctoring is coming soon! Stay tuned for updates.'
  }
];

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [hasCheckedInitialLogin, setHasCheckedInitialLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    const checkLogin = () => {
      // Check if session is valid
      if (!sessionManager.isLoggedIn() || sessionManager.isSessionExpired()) {
        setIsLoggedIn(false);
        setOrgName('');
        setTeacherName('');
        setStudentName('');
        return;
      }

      const userType = sessionManager.getUserType();
      if (userType === 'organization') {
        const org = Cookies.get('org_name');
        setOrgName(org);
        setTeacherName('');
        setStudentName('');
        setIsLoggedIn(!!org);
      } else if (userType === 'teacher') {
        const teacher = Cookies.get('teacher_name');
        setTeacherName(teacher);
        setOrgName('');
        setStudentName('');
        setIsLoggedIn(!!teacher);
      } else if (userType === 'student') {
        const student = localStorage.getItem('student_name');
        setStudentName(student);
        setOrgName('');
        setTeacherName('');
        setIsLoggedIn(!!student);
      }
      
      // Auto-redirect logged-in users to their dashboard (only on first check)
      if (!hasCheckedInitialLogin) {
        setHasCheckedInitialLogin(true);
        if (sessionManager.isLoggedIn() && !sessionManager.isSessionExpired()) {
          const userType = sessionManager.getUserType();
          if (userType === 'organization') {
            navigate('/dashboard');
          } else if (userType === 'teacher') {
            navigate('/teacher-dashboard');
          } else if (userType === 'student') {
            navigate('/student-dashboard');
          }
        }
      }
    };
    checkLogin();
    const interval = setInterval(checkLogin, 500);
    return () => clearInterval(interval);
  }, [navigate, hasCheckedInitialLogin]);

  return (
    <div className="bg-light min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="container flex flex-col items-center justify-center flex-1 text-center py-10" data-aos="fade-up">
        
        <div className="mt-8">
          <h1 className="text-4xl font-bold text-primary mb-3">Welcome to Rocket Assess</h1>
        </div>
        <p className="text-lg text-secondary mb-5 max-w-lg">A modern platform for organizations, teachers, and students to create, manage, and take online tests with ease.</p>
        <div className="flex gap-3 justify-center mb-6">
          {!isLoggedIn && <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>}
          {!isLoggedIn && <a href="#features" className="btn btn-outline btn-lg">Learn More</a>}
          {isLoggedIn && orgName && <Link to="/dashboard" className="btn btn-primary btn-lg">View Dashboard</Link>}
          {isLoggedIn && teacherName && <Link to="/teacher-dashboard" className="btn btn-primary btn-lg">View Dashboard</Link>}
          {isLoggedIn && studentName && <Link to="/student-dashboard" className="btn btn-primary btn-lg">View Dashboard</Link>}
        </div>
        <video controls className="rounded shadow w-full max-w-lg" style={{margin: '0 auto'}} poster="/thumbnail.jpg">
          <source src="/intro.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </header>

      {/* Features Section */}
      <section id="features" className="container py-10">
        <h2 className="text-2xl font-semibold text-center mb-6" data-aos="fade-up">Features</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="card" data-aos="fade-up" data-aos-delay="100">
            <div className="card-header text-primary">For Organizations</div>
            <div className="card-body">Manage your teachers and students, monitor test activity, and view analytics in one place. Role-based access and secure data management.</div>
          </div>
          <div className="card" data-aos="fade-up" data-aos-delay="200">
            <div className="card-header text-primary">For Teachers</div>
            <div className="card-body">Create test rooms, invite students, build question pools, and review submissions easily. Auto-scoring and instant feedback.</div>
          </div>
          <div className="card" data-aos="fade-up" data-aos-delay="300">
            <div className="card-header text-primary">For Students</div>
            <div className="card-body">Join tests, answer questions, and track your progress with instant feedback and results. Mobile-friendly and accessible.</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="card" data-aos="fade-up" data-aos-delay="400">
            <div className="card-header text-primary">Private Test Invites</div>
            <div className="card-body">Only invited students can access tests, ensuring privacy and integrity.</div>
          </div>
          <div className="card" data-aos="fade-up" data-aos-delay="500">
            <div className="card-header text-primary">Analytics & Reports</div>
            <div className="card-body">Detailed analytics for organizations and teachers. Export results and monitor trends.</div>
          </div>
          <div className="card" data-aos="fade-up" data-aos-delay="600">
            <div className="card-header text-primary">Secure & Reliable</div>
            <div className="card-body">All data is encrypted and securely stored. 99.9% uptime and regular backups.</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="container py-10">
        <h2 className="text-2xl font-semibold text-center mb-6" data-aos="fade-up">How It Works</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="card" data-aos="fade-right" data-aos-delay="100">
            <div className="card-header text-primary">1. Register</div>
            <div className="card-body">Organizations sign up and set up their profile. Teachers and students are invited via email.</div>
          </div>
          <div className="card" data-aos="fade-right" data-aos-delay="200">
            <div className="card-header text-primary">2. Create Tests</div>
            <div className="card-body">Teachers create test rooms, add questions, and schedule assessments.</div>
          </div>
          <div className="card" data-aos="fade-left" data-aos-delay="300">
            <div className="card-header text-primary">3. Take & Submit</div>
            <div className="card-body">Students join with secure invites, complete tests, and submit answers online.</div>
          </div>
          <div className="card" data-aos="fade-left" data-aos-delay="400">
            <div className="card-header text-primary">4. Review & Analyze</div>
            <div className="card-body">Teachers review submissions, auto-score, and analyze results with powerful tools.</div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container py-10">
        <h2 className="text-2xl font-semibold text-center mb-6" data-aos="fade-up">What Our Users Say</h2>
        <div className="grid grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div className="card" key={i} data-aos="zoom-in" data-aos-delay={i * 150}>
              <div className="card-body">
                <p className="mb-3">"{t.quote}"</p>
                <div className="text-sm text-secondary">- {t.name}, {t.org}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container py-10">
        <h2 className="text-2xl font-semibold text-center mb-6" data-aos="fade-up">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <details className="card mb-3" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
              <summary className="card-header cursor-pointer text-primary">{faq.q}</summary>
              <div className="card-body text-secondary">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="container py-10">
        <h2 className="text-2xl font-semibold text-center mb-6" data-aos="fade-up">Contact Us</h2>
        <div className="flex justify-center">
          <div className="card max-w-lg w-full" data-aos="fade-up" data-aos-delay="100">
            <form className="flex flex-col gap-4">
              <input type="text" className="rounded border p-2" placeholder="Your Name" />
              <input type="email" className="rounded border p-2" placeholder="Your Email" />
              <textarea className="rounded border p-2" placeholder="Your Message" rows={4}></textarea>
              <button type="submit" className="btn btn-primary w-full">Send Message</button>
            </form>
            <div className="text-center text-sm text-secondary mt-4">
              Or email us at <a href="mailto:dongjunzejeff@gmail.com" className="text-primary">dongjunzejeff@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        &copy; {new Date().getFullYear()} Rocket Assess. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
