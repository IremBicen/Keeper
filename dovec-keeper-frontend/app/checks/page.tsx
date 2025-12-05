"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/sidebar/Sidebar";
import { useUser } from "../context/UserContext";
import api from "../utils/api";
import "../Dashboard.css";
import "../components/table.css";
import "../components/buttons.css";
import "./checks.css";

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface Survey {
  _id: string;
  id?: string;
  title?: string;
  surveyName?: string;
  status?: string;
}

interface Response {
  _id: string;
  employee: User | string;
  survey: Survey | string;
  status: string;
}

export default function ChecksPage() {
  const { user, token } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, token, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user || user.role !== "admin") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [usersRes, surveysRes, responsesRes] = await Promise.all([
          api.get<User[]>("/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<Survey[]>("/surveys", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<Response[]>("/responses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const validUsers = (usersRes.data || []).filter(
          (u: any) => u && (u._id || u.id)
        );
        const validSurveys = (surveysRes.data || []).filter(
          (s: any) => s && (s._id || s.id)
        );
        const validResponses = (responsesRes.data || []).filter(
          (r: any) => r && (r._id || r.id)
        );

        setUsers(validUsers);
        setSurveys(validSurveys);
        setResponses(validResponses);
      } catch (err: any) {
        console.error("❌ Error fetching data for checks page:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load completion data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Build completion map: employeeId -> Set of surveyIds that are submitted
  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (responses || []).forEach((r) => {
      if (!r || r.status !== "submitted") return;
      const employeeIdRaw =
        typeof r.employee === "string"
          ? r.employee
          : (r.employee as any)?._id || (r.employee as any)?.id;
      const surveyIdRaw =
        typeof r.survey === "string"
          ? r.survey
          : (r.survey as any)?._id || (r.survey as any)?.id;
      const employeeId = employeeIdRaw?.toString();
      const surveyId = surveyIdRaw?.toString();
      if (!employeeId || !surveyId) return;

      if (!map.has(employeeId)) {
        map.set(employeeId, new Set<string>());
      }
      map.get(employeeId)!.add(surveyId);
    });
    return map;
  }, [responses]);

  const sortedSurveys = useMemo(() => {
    return [...surveys].sort((a, b) => {
      const nameA = (a.title || a.surveyName || "").toLowerCase();
      const nameB = (b.title || b.surveyName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [surveys]);

  const sortedUsers = useMemo(() => {
    let list = [...users].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    if (onlyIncomplete && sortedSurveys.length > 0) {
      list = list.filter((u) => {
        const empId = (u._id || u.id).toString();
        const submitted = completionMap.get(empId) || new Set<string>();
        // user is incomplete if at least one survey is not in submitted
        return sortedSurveys.some((s) => {
          const sId = (s._id || s.id).toString();
          return !submitted.has(sId);
        });
      });
    }

    return list;
  }, [users, onlyIncomplete, sortedSurveys, completionMap]);

  if (!user || !token) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <header className="checks-header">
          <h1 className="dashboard-title">Survey Completion Check</h1>
          <div className="checks-filters">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={onlyIncomplete}
                onChange={(e) => setOnlyIncomplete(e.target.checked)}
              />
              <span>Show only users with missing surveys</span>
            </label>
          </div>
        </header>

        <div className="box-container">
          {loading ? (
            <p>Loading completion data...</p>
          ) : error ? (
            <p style={{ color: "#dc2626" }}>{error}</p>
          ) : sortedUsers.length === 0 || sortedSurveys.length === 0 ? (
            <p style={{ color: "#71717a" }}>
              No users or surveys found to display completion matrix.
            </p>
          ) : (
            <div className="checks-table-wrapper">
              <table className="table-container checks-table">
                <thead>
                  <tr>
                    <th>User</th>
                    {sortedSurveys.map((survey) => (
                      <th key={survey._id || survey.id}>
                        {survey.title || survey.surveyName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => {
                    const empId = (u._id || u.id).toString();
                    const submitted = completionMap.get(empId) || new Set<string>();
                    return (
                      <tr key={empId}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{u.name}</span>
                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                              {u.email}
                            </span>
                          </div>
                        </td>
                        {sortedSurveys.map((survey) => {
                          const sId = (survey._id || survey.id).toString();
                          const filled = submitted.has(sId);
                          return (
                            <td
                              key={sId}
                              className={filled ? "checks-cell-filled" : "checks-cell-missing"}
                            >
                              {filled ? "✔" : "✖"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


