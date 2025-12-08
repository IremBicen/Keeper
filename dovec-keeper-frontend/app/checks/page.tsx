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
  evaluator?: User | string;
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

  // Build completion map: actorId -> (surveyId -> Set<targetEmployeeId>)
  // actorId:
  //  - self/keeper/general surveys: employee (self)
  //  - manager/teammate surveys: evaluator (who filled the form)
  const completionMap = useMemo(() => {
    const map = new Map<string, Map<string, Set<string>>>();
    (responses || []).forEach((r) => {
      if (!r || r.status !== "submitted") return;

      // Determine survey type (manager / teammate / other)
      const surveyObj: any =
        typeof r.survey === "string" ? null : (r.survey as any);
      const surveyTitleLower = (
        surveyObj?.title ||
        surveyObj?.surveyName ||
        ""
      )
        .toString()
        .toLowerCase();
      const isManagerForm = surveyTitleLower.includes("yönetici");
      const isTeammateForm = surveyTitleLower.includes("takım arkadaşı");

      const evaluatorIdRaw =
        typeof r.evaluator === "string"
          ? r.evaluator
          : (r.evaluator as any)?._id || (r.evaluator as any)?.id;
      const surveyIdRaw =
        typeof r.survey === "string"
          ? r.survey
          : (r.survey as any)?._id || (r.survey as any)?.id;
      const employeeIdRaw =
        typeof r.employee === "string"
          ? r.employee
          : (r.employee as any)?._id || (r.employee as any)?.id;

      // actorId is the person whose completion we track
      let actorIdRaw: any;
      if (isManagerForm || isTeammateForm) {
        // For manager/teammate forms, track completion per evaluator
        actorIdRaw = evaluatorIdRaw || employeeIdRaw;
      } else {
        // For self/keeper/general forms, track completion per employee (self)
        actorIdRaw = employeeIdRaw;
      }

      const actorId = actorIdRaw?.toString();
      const surveyId = surveyIdRaw?.toString();
      const targetId = employeeIdRaw?.toString();
      if (!actorId || !surveyId || !targetId) return;

      if (!map.has(actorId)) {
        map.set(actorId, new Map<string, Set<string>>());
      }
      const bySurvey = map.get(actorId)!;
      if (!bySurvey.has(surveyId)) {
        bySurvey.set(surveyId, new Set<string>());
      }
      bySurvey.get(surveyId)!.add(targetId);
    });
    return map;
  }, [responses]);

  const usersById = useMemo(() => {
    const m = new Map<string, User>();
    (users || []).forEach((u) => {
      const idRaw = (u as any)?._id || (u as any)?.id;
      if (!idRaw) return;
      m.set(idRaw.toString(), u);
    });
    return m;
  }, [users]);

  const surveysById = useMemo(() => {
    const m = new Map<string, Survey>();
    (surveys || []).forEach((s) => {
      const idRaw = (s as any)?._id || (s as any)?.id;
      if (!idRaw) return;
      m.set(idRaw.toString(), s);
    });
    return m;
  }, [surveys]);

  const getUserId = (u: User) =>
    ((u as any)?._id || (u as any)?.id)?.toString() || "";

  const getSurveyId = (s: Survey) =>
    ((s as any)?._id || (s as any)?.id)?.toString() || "";

  const getSubmittedTargets = (evaluatorId: string, surveyId: string) => {
    const bySurvey = completionMap.get(evaluatorId);
    if (!bySurvey) return new Set<string>();
    return bySurvey.get(surveyId) || new Set<string>();
  };

  const getCompletionStats = (u: User, survey: Survey) => {
    const uId = getUserId(u);
    const sId = getSurveyId(survey);
    if (!uId || !sId)
      return { filled: 0, required: 0, isManagerForm: false, isTeammateForm: false };

    const title = (survey.title || survey.surveyName || "").toLowerCase();
    const isManagerForm = title.includes("yönetici");
    const isTeammateForm = title.includes("takım arkadaşı");

    const role = (u.role || "").toLowerCase();
    const deptRaw = (u.department || "").toString().trim();
    const dept = deptRaw;

    const submittedTargets = getSubmittedTargets(uId, sId);

    if (isManagerForm) {
      if (!dept)
        return { filled: 0, required: 0, isManagerForm, isTeammateForm };

      const deptNorm = dept.toString().trim().toLowerCase();

      const inSameDept = (v: User) => {
        const mainDept = (v.department || "").toString().trim().toLowerCase();
        const extraDepts = Array.isArray((v as any).departments)
          ? (v as any).departments.map((d: any) =>
              d?.toString().trim().toLowerCase()
            )
          : [];
        const allDepts = [mainDept, ...extraDepts].filter(Boolean);
        return allDepts.includes(deptNorm) && getUserId(v) !== uId;
      };

      let requiredUsers: User[] = [];

      if (role === "employee") {
        // Employee fallback logic: manager -> coordinator -> director
        const managers = users.filter(
          (v) => (v.role || "").toLowerCase() === "manager" && inSameDept(v)
        );
        const coordinators = users.filter(
          (v) => (v.role || "").toLowerCase() === "coordinator" && inSameDept(v)
        );
        const directors = users.filter(
          (v) => (v.role || "").toLowerCase() === "director" && inSameDept(v)
        );

        if (managers.length) {
          requiredUsers = managers;
        } else if (coordinators.length) {
          requiredUsers = coordinators;
        } else if (directors.length) {
          requiredUsers = directors;
        }
      } else if (role === "manager") {
        // Manager must evaluate all coordinators and directors in their department(s)
        requiredUsers = users.filter(
          (v) =>
            inSameDept(v) &&
            ["coordinator", "director"].includes(
              (v.role || "").toLowerCase()
            )
        );
      } else if (role === "coordinator") {
        // Coordinator evaluates all directors in their department(s)
        requiredUsers = users.filter(
          (v) =>
            inSameDept(v) && (v.role || "").toLowerCase() === "director"
        );
      } else {
        // Directors (and any other roles) have no superior requirement
        requiredUsers = [];
      }

      const requiredTargets = requiredUsers
        .map((v) => getUserId(v))
        .filter(Boolean);

      const filled = requiredTargets.filter((tid) => submittedTargets.has(tid))
        .length;
      const required = requiredTargets.length;

      return { filled, required, isManagerForm, isTeammateForm };
    }

    if (isTeammateForm) {
      if (!dept)
        return { filled: 0, required: 0, isManagerForm, isTeammateForm };

      const teammates = users.filter((v) => {
        const vDept = (v.department || "").toString().trim();
        const vRole = (v.role || "").toLowerCase();
        const vId = getUserId(v);
        return (
          vRole === "employee" &&
          vDept === dept &&
          vId &&
          vId !== uId
        );
      });

      const required = teammates.length;
      const filled = teammates.filter((tm) =>
        submittedTargets.has(getUserId(tm))
      ).length;

      return { filled, required, isManagerForm, isTeammateForm };
    }

    // Default: self-surveys (e.g. keeper) → completed if they evaluated themselves
    const filled = submittedTargets.has(uId) ? 1 : 0;
    const required = 1;

    return { filled, required, isManagerForm, isTeammateForm };
  };

  const isCellFilled = (u: User, survey: Survey): boolean => {
    const { filled, required } = getCompletionStats(u, survey);
    // If nothing is required (no superior, no teammates, etc.), treat as completed
    if (required === 0) return true;
    return filled >= required;
  };

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
        // user is incomplete if at least one survey is not completed
        return sortedSurveys.some((s) => !isCellFilled(u, s));
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
                    const empIdRaw = (u as any)?._id || (u as any)?.id;
                    if (!empIdRaw) return null;
                    const empId = empIdRaw.toString();
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
                          const sIdRaw = (survey as any)?._id || (survey as any)?.id;
                          if (!sIdRaw) return null;
                          const sId = sIdRaw.toString();

                          const {
                            filled,
                            required,
                            isManagerForm,
                            isTeammateForm,
                          } = getCompletionStats(u, survey);
                          const completed = isCellFilled(u, survey);

                          const showFraction =
                            (isManagerForm || isTeammateForm) && required > 0;

                          return (
                            <td
                              key={sId}
                              className={completed ? "checks-cell-filled" : "checks-cell-missing"}
                            >
                              {showFraction
                                ? `${filled}/${required}`
                                : completed
                                ? "✔"
                                : "✖"}
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


