"use client";

import { useUser } from "./context/UserContext";
import { useEffect, useMemo, useState } from "react";
import api from "./utils/api";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/sidebar/Sidebar";
import "./Dashboard.css";
import "./components/table.css";
import "./components/buttons.css";
import { computeSurveyCompletionForUser } from "./utils/completion";

export default function DashboardPage() {
  const { user, token, logout } = useUser();
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and redirect if needed
  useEffect(() => {
    const checkAuth = () => {
      const timer = setTimeout(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        if (!storedUser || !storedToken) {
          setLoading(false);
          router.push("/login");
          return;
        }
        
        if (!user && !token) {
          setLoading(true);
        } else {
          setLoading(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    };

    checkAuth();
  }, [user, token, router]);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch surveys, all users (for evaluation rules), and current user's responses
        const [surveyRes, usersRes, responsesRes] = await Promise.all([
          api.get("/surveys"),
          api.get("/users", { params: { forEvaluation: true } }),
          api.get("/responses"),
        ]);

        const validSurveys = (surveyRes.data || []).filter(
          (survey: any) => survey && (survey._id || survey.id)
        );
        setSurveys(validSurveys);

        const validUsers = (usersRes.data || []).filter(
          (u: any) => u && (u._id || u.id)
        );
        setUsers(validUsers);

        const validResponses = (responsesRes.data || []).filter(
          (r: any) => r && (r._id || r.id)
        );
        setResponses(validResponses);
      } catch (err: any) {
        console.error("❌ Error fetching data:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  const submissionStatusBySurvey = useMemo(
    () =>
      computeSurveyCompletionForUser({
        user,
        surveys,
        users,
        responses,
      }),
    [user, users, surveys, responses]
  );

  // Show loading while checking auth or redirecting
  if (loading || !user || !token) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>Loading...</p>
        {!user && !token && (
          <button 
            onClick={() => router.push("/login")}
            className="btn btn-light"
          >
            Go to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome, {user?.name || "User"}
          </h1>
        </header>

        {error && (
          <div className="box-container" style={{ margin: '1rem 2.5rem', backgroundColor: '#fee', borderColor: '#fcc', color: '#c33' }}>
            <strong>Error:</strong> {error}
            <br />
            <small>Check browser console (F12) for more details.</small>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-box-title">Total Surveys</div>
            <div className="stat-box-count">{surveys.length}</div>
          </div>
          {user.role === "admin" && (
            <div className="stat-box">
              <div className="stat-box-title">Total Users</div>
              <div className="stat-box-count">{users.length}</div>
            </div>
          )}
          <div className="stat-box">
            <div className="stat-box-title">Active Surveys</div>
            <div className="stat-box-count">
              {surveys.filter((s: any) => s.status === "active" || s.status === "Active").length}
            </div>
          </div>
        </div>

        {/* Recent Surveys */}
        <div className="box-container">
          <h2 className="box-title">My Surveys</h2>
          {loading ? (
            <p>Loading surveys...</p>
          ) : surveys.length === 0 ? (
            <p style={{ color: '#71717a' }}>No surveys found. Create surveys to see them here.</p>
          ) : (
            <table className="table-container">
              <thead>
                <tr>
                  <th>Survey Name</th>
                  <th>Status</th>
                  <th>Submission</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 5).map((survey: any) => {
                  const surveyId =
                    (survey._id || survey.id)?.toString();
                  const stats =
                    surveyId && submissionStatusBySurvey.get(surveyId);
                  const filled = stats?.filled ?? 0;
                  const required = stats?.required ?? 0;
                  const isFilled =
                    required === 0 ? true : filled >= required;
                  
                  return (
                    <tr key={surveyId}>
                      <td>{survey.title || survey.surveyName}</td>
                      <td>
                        <span className={`status-badge status-${(survey.status || "not-started").toLowerCase()}`}>
                          {survey.status || "Not Started"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${isFilled ? 'status-filled' : 'status-waiting'}`}>
                          {isFilled ? 'Completed' : 'Waiting'}
                        </span>
                      </td>
                      <td>{survey.startDate ? new Date(survey.startDate).toLocaleDateString() : "N/A"}</td>
                      <td>{survey.endDate ? new Date(survey.endDate).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Admin: Recent Users */}
        {user.role === "admin" && (
          <div className="box-container">
            <h2 className="box-title">Users</h2>
            {loading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p style={{ color: '#71717a' }}>No users found. Create users in the database.</p>
            ) : (
              <table className="table-container">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((u: any) => (
                    <tr key={u._id || u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`status-badge status-${(u.role || "employee").toLowerCase()}`}>
                          {u.role || "employee"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
