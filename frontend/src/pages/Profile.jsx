import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const teacherPk = Cookies.get('teacher_pk');
  const studentEmail = localStorage.getItem('student_email');
  const navigate = useNavigate();

  useEffect(() => {
    if (teacherPk) {
      api.get(`/api/teacher-org-info/?teacher_id=${teacherPk}`)
        .then(res => {
          const data = res.data;
          if (data.teacher_name) setName(data.teacher_name);
          if (data.email) setEmail(data.email);
          if (data.org_name) setOrg(data.org_name);
        });
    } else if (studentEmail) {
      api.get(`/api/student-profile/?email=${encodeURIComponent(studentEmail)}`)
        .then(res => {
          const data = res.data;
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.organization_name) setOrg(data.organization_name);
        });
    }
  }, [teacherPk, studentEmail]);

  const handleBack = () => {
    if (teacherPk) {
      navigate('/teacher-dashboard');
    } else if (studentEmail) {
      navigate('/student-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light">
      <div className="card max-w-md w-full mx-auto mt-8 p-8">
        <h2 className="text-2xl font-bold mb-6 text-primary text-center">Profile</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">Name:</label>
          <div className="bg-gray-100 rounded px-4 py-2">{name}</div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">Email:</label>
          <div className="bg-gray-100 rounded px-4 py-2">{email}</div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">Organization:</label>
          <div className="bg-gray-100 rounded px-4 py-2">{org}</div>
        </div>
        <button className="btn btn-primary w-full mt-6" onClick={handleBack}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default Profile; 