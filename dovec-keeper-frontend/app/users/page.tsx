"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { Sidebar } from '../components/sidebar/Sidebar';
import SpecificEmployeeDetails from './specificEmployeeDetailsForm/specificEmployeeDetails';
import './users.css';
import '../components/table.css';
import '../components/buttons.css';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  kpi?: number;
  createdAt?: string;
  updatedAt?: string;
}

function UsersPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, user: currentUser } = useUser();
  const [usersData, setUsersData] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [sendingPasswordUserId, setSendingPasswordUserId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect employees away from this page
  useEffect(() => {
    if (currentUser && currentUser.role === "employee") {
      router.push("/");
    }
  }, [currentUser, router]);

  // ---------------- Backend'den tüm kullanıcıları çek ---------------- 
  useEffect(() => {
    const fetchUsers = async () => {
      // Don't fetch if user is an employee (they shouldn't access this page)
      if (!token || (currentUser && currentUser.role === "employee")) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get<User[]>('/users');
        setUsersData(res.data || []);

      } catch (err: any) {
        console.error('Error fetching users:', err);
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        
        if (status === 403) {
          setError("You don't have permission to view users. Admin or Manager access required.");
        } else if (status === 401) {
          setError("Please login to view users.");
        } else {
          setError(message || "Failed to load users.");
        }
        
        setUsersData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token, currentUser]);

  // ---------------- Fetch user by ID function ----------------
  const fetchUserById = async (userId: string) => {
    if (!token) {
      console.error('❌ Cannot fetch user: token is missing');
      return null;
    }
    
    try {
      setLoadingUser(true);
      const res = await api.get<User>(`/users/${userId}`);
      return res.data;
    } catch (err: any) {
      console.error('❌ Error fetching user:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      if (status === 404) {
        setError(`User not found with ID: ${userId}`);
      } else if (status === 403) {
        setError("You don't have permission to view this user.");
      } else {
        setError(message || "Failed to load user details.");
      }
      return null;
    } finally {
      setLoadingUser(false);
    }
  };

  const sendPasswordForUser = async (userId: string, email: string) => {
    if (!token || !currentUser || currentUser.role !== "admin") return;
    try {
      setSendingPasswordUserId(userId);
      await api.post(`/users/${userId}/send-password`);
      alert(`Password email sent to ${email}`);
    } catch (err: any) {
      console.error("Error sending password email:", err);
      const message = err.response?.data?.message || err.message || "Failed to send password email.";
      alert(message);
    } finally {
      setSendingPasswordUserId(null);
    }
  };

  const sendPasswordsForAll = async () => {
    if (!token || !currentUser || currentUser.role !== "admin") return;
    if (!usersData.length) return;
    const confirmSend = window.confirm(
      "This will reset passwords and send a new password email to all listed users. Continue?"
    );
    if (!confirmSend) return;

    try {
      setSendingAll(true);
      for (const u of usersData) {
        const id = u._id || u.id;
        if (!id) continue;
        try {
          await api.post(`/users/${id}/send-password`);
        } catch (err) {
          console.error("Error sending password for user", id, err);
        }
      }
      alert("Password emails have been sent (where possible).");
    } finally {
      setSendingAll(false);
    }
  };

  // ---------------- User link ile seçme ----------------
  useEffect(() => {
    const userId = searchParams.get('employeeId') || searchParams.get('userId');
    if (userId && token) {
      fetchUserById(userId).then(user => {
        if (user) {
          setSelectedUser(user);
        }
      });
    }
  }, [searchParams, token]);


  const handleClose = () => {
    const source = searchParams.get('source');
    if (source === 'results') {
      // Navigate back to results page with refresh param to recalculate scores
      router.push('/results?refresh=true', { scroll: false });
    } else {
      // Clear selected user to go back to the list
      setSelectedUser(null);
      // Also clear any URL parameters
      router.push('/users', { scroll: false });
    }
  };

  // Don't render the page for employees
  if (currentUser && currentUser.role === "employee") {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main users-main">
          <div className="box-container" style={{ margin: '1rem 2.5rem', backgroundColor: '#fee', borderColor: '#fcc', color: '#c33', padding: '2rem', textAlign: 'center' }}>
            <strong>Access Denied</strong>
            <p style={{ marginTop: '1rem' }}>
              You don't have permission to view this page. Employees cannot access the Users page.
            </p>
            <button 
              onClick={() => router.push("/")} 
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Go to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main users-main">
        <header className="users-header">
          <h1 className="users-title">Users</h1>
          {currentUser?.role === "admin" && (
            <button
              className="btn btn-primary"
              onClick={sendPasswordsForAll}
              disabled={sendingAll || loading}
            >
              {sendingAll ? "Sending Passwords..." : "Send Passwords"}
            </button>
          )}
        </header>

        {error && (
          <div className="box-container" style={{ margin: '1rem 2.5rem', backgroundColor: '#fee', borderColor: '#fcc', color: '#c33' }}>
            <strong>Error:</strong> {error}
            {error.includes("permission") && currentUser && (
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                Your current role: <strong>{currentUser.role}</strong>. Admin role is required to view all users.
              </p>
            )}
          </div>
        )}

        {selectedUser ? (
          loadingUser ? (
            <div className="box-container" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading user details...</p>
            </div>
          ) : (
            <SpecificEmployeeDetails
              employeeId={(selectedUser._id || selectedUser.id) as string}
              isModal={false}
              onClose={handleClose}
            />
          )
        ) : (
          <div className="box-container">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading users...</p>
              </div>
            ) : (
              <table className="table-container">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.length > 0 ? (
                    usersData.map(user => (
                      <tr key={user._id || user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`status-badge status-${(user.role || "employee").toLowerCase()}`}>
                            {user.role || "employee"}
                          </span>
                        </td>
                        <td>{user.department || "N/A"}</td>
                        <td>
                          <button 
                            onClick={async () => {
                              const userId = user._id || user.id;
                              if (userId) {
                                const fetchedUser = await fetchUserById(userId.toString());
                                if (fetchedUser) {
                                  setSelectedUser(fetchedUser);
                                }
                              }
                            }} 
                            className="btn btn-light"
                            disabled={loadingUser}
                          >
                            {loadingUser ? 'Loading...' : 'See Details'}
                          </button>
                          {currentUser?.role === "admin" && (
                            <button
                              onClick={() =>
                                sendPasswordForUser(
                                  (user._id || user.id) as string,
                                  user.email
                                )
                              }
                              className="btn btn-secondary"
                              style={{ marginLeft: "0.5rem" }}
                              disabled={
                                sendingAll ||
                                sendingPasswordUserId === (user._id || user.id)
                              }
                            >
                              {sendingPasswordUserId === (user._id || user.id)
                                ? "Sending..."
                                : "Send Password"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="no-users-message">
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <p><strong>No users found</strong></p>
                          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                            There are no users in the database yet.
                            <br />
                            Create users through the registration endpoint or admin panel.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersPageComponent />
    </Suspense>
  );
}
