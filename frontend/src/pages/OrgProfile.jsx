import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import './OrgProfile.css';

const OrgProfile = () => {
  const [orgData, setOrgData] = useState({
    org_code: '',
    name: '',
    website: '',
    email: '',
    phone: '',
    city: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orgCode = Cookies.get('org_code');
  const navigate = useNavigate();

  useEffect(() => {
    if (!orgCode) {
      setError('Organization code not found. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchOrgData = async () => {
      try {
        const response = await api.get(`/api/organization-profile/?org_code=${orgCode}`);
        const data = response.data;
        setOrgData(data);
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, [orgCode]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="org-profile-bg">
        <div className="org-profile-card" style={{alignItems: 'center', justifyContent: 'center', minHeight: 200}}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" style={{borderWidth: 3, borderColor: '#2563eb'}}></div>
          <p className="org-profile-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="org-profile-bg">
        <div className="org-profile-card" style={{alignItems: 'center', justifyContent: 'center', minHeight: 200}}>
          <div className="org-profile-subtitle" style={{color: '#e11d48'}}>{error}</div>
          <button className="org-profile-back" onClick={handleBack}>
            <span style={{fontSize: 22, lineHeight: 1}}>&larr;</span> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="org-profile-bg">
      <div className="org-profile-card">
        <div className="org-profile-header">
          <div>
            <h1 className="org-profile-title">Organization Profile</h1>
            <div className="org-profile-subtitle">View your organization information</div>
          </div>
          <button className="org-profile-back" onClick={handleBack}>
            <span style={{fontSize: 22, lineHeight: 1}}>&larr;</span> Back to Dashboard
          </button>
        </div>
        <div className="org-profile-badge">
          <div className="org-profile-badge-label">Organization Code</div>
          <div className="org-profile-badge-code">{orgData.org_code}</div>
        </div>
        <div className="org-profile-details">
          <div className="org-profile-details-title">Organization Details</div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">Organization Name</div>
            <div className="org-profile-detail-value">{orgData.name}</div>
          </div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">Website</div>
            <div className="org-profile-detail-value">
              {orgData.website ? (
                <a href={orgData.website} target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline'}}>{orgData.website}</a>
              ) : (
                <span style={{color: '#64748b'}}>Not specified</span>
              )}
            </div>
          </div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">Email</div>
            <div className="org-profile-detail-value">
              {orgData.email ? (
                <a href={`mailto:${orgData.email}`} style={{color: '#2563eb', textDecoration: 'underline'}}>{orgData.email}</a>
              ) : (
                <span style={{color: '#64748b'}}>Not specified</span>
              )}
            </div>
          </div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">Phone</div>
            <div className="org-profile-detail-value">
              {orgData.phone ? (
                <a href={`tel:${orgData.phone}`} style={{color: '#2563eb', textDecoration: 'underline'}}>{orgData.phone}</a>
              ) : (
                <span style={{color: '#64748b'}}>Not specified</span>
              )}
            </div>
          </div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">City</div>
            <div className="org-profile-detail-value">{orgData.city || <span style={{color: '#64748b'}}>Not specified</span>}</div>
          </div>
          <div className="org-profile-detail-row">
            <div className="org-profile-detail-label">Created</div>
            <div className="org-profile-detail-value">
              {orgData.created_at ? (
                new Date(orgData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              ) : (
                <span style={{color: '#64748b'}}>Unknown</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgProfile; 