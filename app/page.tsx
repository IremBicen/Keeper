"use client";

import "./Dashboard.css";
import { useUser } from "./context/UserContext";
import { useState, useEffect } from "react";
import Notification from "./components/notification/Notification";
import { useMockData, StatBoxProps } from "./hooks/useMockData"; // Import StatBoxProps
import { Sidebar } from "./components/sidebar/Sidebar";
import "./components/table.css";
import "./components/buttons.css";
import { ThemeToggleButton } from "./components/ThemeToggleButton/ThemeToggleButton";

function StatBox({ title, count }: StatBoxProps) {  // This function is used to display the statistics of the evaluations (coming from the useMockData hook)
  return (
    <div className="stat-box">
      <h2 className="stat-box-title">{title}</h2>
      <p className="stat-box-count">{count}</p>
    </div>
  );
}

function RoleSwitcher() {  // This function is used to switch the role of the user (manager or admin)
  const { role, setRole } = useUser();

  return (
    <div className="role-switcher">
      <span>Current Role: <strong>{role}</strong></span>
      <div className="role-buttons">
        <button onClick={() => setRole('manager')} disabled={role === 'manager'}>
          Set to Manager
        </button>
        <button onClick={() => setRole('admin')} disabled={role === 'admin'}>
          Set to Admin
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const {
    user,
    totalEvaluations,
    savedEvaluations,
    draftEvaluations,
    recentEvaluations,
    sortedSurveys,
  } = useMockData();
  const { role } = useUser();
  const [notification, setNotification] = useState('');

  useEffect(() => { // This is used to display the notification message that is stored in the session storage
    const notificationMessage = sessionStorage.getItem('notification');
    if (notificationMessage) {
      setNotification(notificationMessage);
      sessionStorage.removeItem('notification');
    }
  }, []);

  return (
    <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">

          <RoleSwitcher />  {/* This is the role switcher button that will be shown to the user */} 

          {notification && <Notification message={notification} onClose={() => setNotification('')} />}
          <header className="dashboard-header">
            <h1 className="dashboard-title">My Dashboard</h1>
            <div className="dashboard-user-area">
                <div className="dashboard-user-box">
                  <span>{user.name}</span>
                </div>
                <ThemeToggleButton />
            </div>
        </header>

        {/* Statistics */}
        <div className="stats-grid">
          <StatBox title="Total Evaluations" count={totalEvaluations} />
          <StatBox title="Submitted Evaluations" count={savedEvaluations} />
          <StatBox title="Draft Evaluations" count={draftEvaluations} />
        </div>

        {/* My Surveys - This part going to be different for users with different roles*/}
        {/* If the user is a manager, they can see the my surveys table */}
        {role === 'manager' && (
          <div className="box-container">
            <h2 className="box-title">My Surveys</h2>
            <table className="table-container">
              <thead className="table-header">
                <tr>
                  <th>Survey Name</th>
                  <th>Categories</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Submission Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedSurveys.map((survey) => {
                  const userEvaluation = recentEvaluations.find(e => e.surveyName === survey.surveyName);
                  const submissionStatus = userEvaluation ? userEvaluation.submission_status : 'Not Started';
                  const isSubmitted = submissionStatus === 'Submitted';

                  return (
                    <tr key={survey.id}>
                      <td>{survey.surveyName}</td>
                      <td className="categories-cell">
                        {survey.categories.map((category, catIndex) => (
                          <span key={catIndex} className="category-tag">{category}{catIndex < survey.categories.length - 1 ? ', ' : ''}</span>  // Adds a comma between categories except the last one
                        ))}
                      </td>
                      <td>{survey.startDate}</td>
                      <td>{survey.endDate}</td>
                      <td>
                        <span className={`status-badge status-${survey.status.toLowerCase()}`}>
                          {survey.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${submissionStatus.toLowerCase().replace(' ', '-')}`}>
                          {submissionStatus}
                        </span>
                      </td>
                      <td>
                        {survey.status === 'Active' ? ( // If the survey is active, show the join button
                          <a
                            href={`/form?survey=${encodeURIComponent(survey.surveyName)}`}
                            className={`btn btn-light ${isSubmitted ? 'disabled' : ''}`}
                            onClick={(e) => { if (isSubmitted) e.preventDefault(); }}
                          >
                            Join
                          </a>
                        ) : (
                          <span> </span> // If the survey is not active, show a space
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Evaluations */}
        <div className="box-container">
          <h2 className="box-title">Recent Evaluations</h2>
          <table className="table-container">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvaluations.map((evaluation, index) => (
                <tr key={index}>
                  <td>{evaluation.employeeName}</td>
                  <td>{evaluation.department}</td>
                  <td>{evaluation.date}</td>
                  <td>
                    <span
                      className={`status-badge status-${evaluation.submission_status.toLowerCase()}`}  // Creates a specific class based on the status of the evaluation
                    >
                      {evaluation.submission_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}