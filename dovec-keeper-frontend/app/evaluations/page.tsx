"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { Survey } from '../types/survey';
import SurveyForm from '../form/surveyForm';
import { Sidebar } from '../components/sidebar/Sidebar';
import '../Dashboard.css';
import './evaluations.css';
import '../components/buttons.css';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function EvaluationsPage() {
  const router = useRouter();
  const { token, user } = useUser();
  const [departments, setDepartments] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  // Fetch departments and users
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);

        // Fetch all users
        const usersRes = await api.get<User[]>('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data || []);

        // Extract unique departments
        const deptSet = new Set<string>();
        usersRes.data.forEach((u: User) => {
          if (u.department) {
            deptSet.add(u.department);
          }
        });
        setDepartments(Array.from(deptSet).sort());

        // Fetch surveys
        const surveysRes = await api.get<Survey[]>('/surveys', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSurveys(surveysRes.data || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const keeperSurveys = surveys.filter((s) => {
    const title = (s.title || s.surveyName || "").toLowerCase();
    return title.includes("keeper");
  });

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedUser(null);
    setSelectedSurvey(null);
  };

  const handleUserChange = (userId: string) => {
    const user = users.find(u => (u._id === userId || u.id === userId));
    setSelectedUser(user || null);
    // Automatically select the first Keeper survey for this evaluation page
    if (user && keeperSurveys.length > 0) {
      setSelectedSurvey(keeperSurveys[0]);
    } else {
      setSelectedSurvey(null);
    }
  };

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
  };

  const handleFormSubmit = async (
    submittedSurvey: Survey,
    status: "Submitted" | "Draft",
    answers: any[]
  ) => {
    if (!token || !selectedUser || !selectedSurvey) return;

    try {
      const responseData = {
        survey: selectedSurvey._id,
        employee: selectedUser._id || selectedUser.id,
        answers: answers,
        status: status === 'Submitted' ? 'submitted' : 'draft'
      };

      await api.post('/responses/submit', responseData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset form
      setSelectedDepartment('');
      setSelectedUser(null);
      setSelectedSurvey(null);
      
      alert('Evaluation submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting evaluation:', err);
      alert(err.response?.data?.message || 'Failed to submit evaluation');
    }
  };

  const handleCloseForm = () => {
    setSelectedSurvey(null);
  };

  const filteredUsers = selectedDepartment
    ? users.filter(u => u.department === selectedDepartment)
    : [];

  // Show survey form if survey and user are selected
  if (selectedSurvey && selectedUser) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          <div className="evaluation-header-container">
            <div className="evaluation-header">
              <div className="evaluation-header-content">
                <h1 className="evaluation-title">Fill Evaluation</h1>
                <button onClick={handleCloseForm} className="btn btn-light evaluation-back-btn">
                  ← Back to Selection
                </button>
              </div>
              <div className="evaluation-info">
                <div className="evaluation-info-item">
                  <span className="evaluation-info-label">Evaluating</span>
                  <span className="evaluation-info-value">{selectedUser.name} ({selectedUser.email})</span>
                </div>
                <div className="evaluation-info-item">
                  <span className="evaluation-info-label">Department</span>
                  <span className="evaluation-info-value">{selectedUser.department || 'N/A'}</span>
                </div>
                <div className="evaluation-info-item">
                  <span className="evaluation-info-label">Survey</span>
                  <span className="evaluation-info-value">{selectedSurvey.title || selectedSurvey.surveyName}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="evaluation-form-wrapper">
            <SurveyForm
              survey={selectedSurvey}
              onClose={handleCloseForm}
              onSubmit={handleFormSubmit}
            />
          </div>
        </main>
      </div>
    );
  }

  // Show selection form
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Employee Evaluations</h1>
        </header>
        {error && (
          <div style={{ padding: '1rem 2.5rem', color: '#ef4444' }}>
            <p>{error}</p>
          </div>
        )}
        <div className="box-container evaluation-selection">
          <div className="evaluation-selection-header">
            <h2 className="box-title">Select Employee and Survey</h2>
            <p className="evaluation-selection-subtitle">
              As an administrator, you can fill out evaluations on behalf of other employees or managers.
            </p>
          </div>
          <div className="evaluation-form">
            {/* Department Selection */}
            <div className="form-group">
              <label htmlFor="department">
                <span className="label-text">Department</span>
                <span className="label-required">*</span>
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select --</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* User Selection */}
            <div className="form-group">
              <label htmlFor="user">
                <span className="label-text">Employee/Manager</span>
                <span className="label-required">*</span>
              </label>
              <select
                id="user"
                value={selectedUser?._id || selectedUser?.id || ''}
                onChange={(e) => handleUserChange(e.target.value)}
                className="form-select"
                disabled={!selectedDepartment}
              >
                <option value="">-- Select --</option>
                {filteredUsers.map(u => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
              {selectedDepartment && filteredUsers.length === 0 && (
                <p className="info-text">No users found in this department.</p>
              )}
            </div>

            {/* Survey info (Keeper only) */}
            <div className="form-group">
              <label>
                <span className="label-text">Survey</span>
                <span className="label-required">*</span>
              </label>
              <div style={{ color: "#e5e7eb" }}>
                {keeperSurveys.length > 0
                  ? keeperSurveys[0].title || keeperSurveys[0].surveyName
                  : "No Keeper survey found"}
              </div>
            </div>

            {/* Start Evaluation Button */}
            {selectedUser && selectedSurvey && (
              <div className="form-actions">
                <button
                  onClick={() => handleSurveySelect(selectedSurvey)}
                  className="btn btn-primary evaluation-start-btn"
                >
                  Start Evaluation →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

