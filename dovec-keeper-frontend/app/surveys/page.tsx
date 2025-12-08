"use client";

import { useState, useEffect } from "react";
import api from "../utils/api";
import { useUser } from "../context/UserContext";
import { Survey } from "../types/survey";
import "../Dashboard.css";
import "./surveys.css";
import NewSurveyForm from "./newSurveyForm/NewSurveyForm";
import Notification from "../components/notification/Notification";
import DeleteConfirmation from "../components/deleteConfirmation/DeleteConfirmation";
import EditSurveyForm from "./editSurveyForm/EditSurveyForm";
import SurveyPreview from "./surveyPreview/SurveyPreview";
import SurveyForm from "../form/surveyForm";
import { Sidebar } from "../components/sidebar/Sidebar";
import "../components/table.css";
import "../components/buttons.css";

export default function SurveysPage() {
  const { token, user } = useUser();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [previewingSurvey, setPreviewingSurvey] = useState<Survey | null>(null);
  const [fillingSurvey, setFillingSurvey] = useState<Survey | null>(null);
  const [submittedSurveyIds, setSubmittedSurveyIds] = useState<Set<string>>(new Set());

  // Fetch surveys from backend
  const fetchSurveys = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get<Survey[]>("/surveys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurveys(res.data);
    } catch (err) {
      console.error("Error fetching surveys:", err);
      setNotification("Failed to load surveys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [token]);

  // Fetch user's submitted responses to determine which self-surveys are already completed
  useEffect(() => {
    const fetchUserSubmittedResponses = async () => {
      if (!token || !user) return;
      try {
        const res = await api.get<any[]>("/responses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userId =
          (user as any)?.id?.toString() || (user as any)?._id?.toString();

        const submitted = new Set<string>();
        (res.data || []).forEach((r: any) => {
          if (!r || r.status !== "submitted") return;
          
          const surveyId =
            typeof r.survey === "string"
              ? r.survey
              : r.survey?._id?.toString() || r.survey?.id?.toString();
          if (!surveyId) return;

          const title = (
            (r.survey && (r.survey as any).title) ||
            (r.survey && (r.survey as any).surveyName) ||
            ""
          )
            .toString()
            .toLowerCase();

          const isTeammateSurvey = title.includes("takım arkadaşı");
          const isManagerSurvey = title.includes("yönetici");

          // For self surveys, completion is based on employee === user
          if (!isTeammateSurvey && !isManagerSurvey) {
            if (!r.employee) return;
            const empId =
              typeof r.employee === "string"
                ? r.employee
                : r.employee._id?.toString() || r.employee.id?.toString();
            if (empId !== userId) return;
            submitted.add(surveyId.toString());
            return;
          }

          // For yönetici surveys, completion is based on evaluator === user
          if (isManagerSurvey) {
            if (!r.evaluator) return;
            const evalId =
              typeof r.evaluator === "string"
                ? r.evaluator
                : (r.evaluator as any)._id?.toString() ||
                  (r.evaluator as any).id?.toString();
            if (evalId !== userId) return;
            submitted.add(surveyId.toString());
            return;
          }

          // For teammate surveys, users can have multiple targets → never hide the button globally
        });

        setSubmittedSurveyIds(submitted);
      } catch (err) {
        console.error("Error fetching user responses for surveys page:", err);
      }
    };

    fetchUserSubmittedResponses();
  }, [token, user]);

  const handleEditClick = (survey: Survey) => {
    setEditingSurvey(survey);
  };

  const handlePreviewClick = (survey: Survey) => {
    setPreviewingSurvey(survey);
  };

  const handleFillSurveyClick = (survey: Survey) => {
    setFillingSurvey(survey);
  };

  const handleDeleteClick = (survey: Survey) => {
    setDeletingSurvey(survey);
  };

  const handleCloseDeleteModal = () => {
    setDeletingSurvey(null);
  };

  const handleConfirmDelete = async () => {
    if (!token || !deletingSurvey) return;
    try {
      await api.delete(`/surveys/${deletingSurvey._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification("Survey successfully deleted!");
      handleCloseDeleteModal();
      fetchSurveys(); // Refresh list
    } catch (err: any) {
      setNotification(err.response?.data?.message || "Failed to delete survey.");
    }
  };

  //---------------------Save Survey Functionality---------------------
  const handleSaveSurvey = async (surveyData: any) => {
    if (!token) {
      setNotification("You must be logged in to create surveys.");
      return;
    }
    try {
      await api.post("/surveys", surveyData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFormOpen(false);
      setNotification("Survey successfully added!");
      fetchSurveys(); // Refresh list
    } catch (err: any) {
      setNotification(err.response?.data?.message || "Failed to create survey.");
    }
  };

  //---------------------Update Survey Functionality---------------------
  const handleUpdateSurvey = async (updatedSurvey: Survey) => {
    if (!token || !editingSurvey) return;
    try {
      await api.put(`/surveys/${editingSurvey._id}`, updatedSurvey, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification("Survey successfully updated!");
      setEditingSurvey(null);
      fetchSurveys(); // Refresh list
    } catch (err: any) {
      setNotification(err.response?.data?.message || "Failed to update survey.");
    }
  };

  //---------------------Submit Survey Form Functionality---------------------
  const handleSurveyFormSubmit = async (
    submittedSurvey: Survey,
    status: "Submitted" | "Draft",
    answers: any[],
    selectedTeammateId?: string
  ) => {
    if (!token || !fillingSurvey || !user) return;
    
    try {
      // For teammate/manager surveys, use selected ID; otherwise use current user ID
      const employeeId = selectedTeammateId || user.id;
      
      const responseData = {
        survey: fillingSurvey._id,
        employee: employeeId, // Use the determined employeeId
        answers: answers,
        status: status === 'Submitted' ? 'submitted' : 'draft'
      };
      
      await api.post("/responses/submit", responseData);
      
      if (status === 'Submitted') {
        setNotification("Survey submitted successfully!");
        setFillingSurvey(null);
        fetchSurveys(); // Refresh to update response count
      } else {
        setNotification("Survey saved as draft!");
        setFillingSurvey(null);
      }
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      setNotification(err.response?.data?.message || "Failed to submit survey. Please try again.");
    }
  };

  // Format date helper
  const formatDate = (date: string | Date | undefined, fallback: string = ""): string => {
    if (!date) return fallback;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString();
    } catch {
      return fallback;
    }
  };

  //------------------------------------------------------------

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <div className="surveys-main">
          {notification && (
            <Notification
              message={notification}
              onClose={() => setNotification(null)}
            />
          )}
          <header className="surveys-header">
            <h1 className="surveys-title">Surveys</h1>
            {user?.role === "admin" && (
              <button
                className="btn btn-primary"
                onClick={() => setIsFormOpen(true)}
              >
                + New Survey
              </button>
            )}
          </header>
          <div className="box-container">
            <table className="table-container">
                <thead>
                    <tr>
                        <th></th>
                        <th>Survey Name</th>
                        <th>Category</th>
                        <th>Start Date</th>
                        <th>Deadline Date</th>
                        <th>Response Number</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} style={{ textAlign: "center" }}>Loading...</td>
                        </tr>
                    ) : surveys.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ textAlign: "center" }}>No surveys found</td>
                        </tr>
                    ) : (
                        surveys.map((survey, index) => (
                            <tr key={survey._id}>
                                <td>{index + 1}</td>
                                <td>{survey.title || survey.surveyName}</td>
                                <td>{Array.isArray(survey.categories) ? survey.categories.join(', ') : ''}</td>
                                <td>{formatDate(survey.startDate)}</td>
                                <td>{formatDate(survey.endDate)}</td>
                                <td>{survey.responses || 0}</td>
                            <td>
                                <div className="action-buttons">
                                  {(() => {
                                    const surveyId = (survey._id || (survey as any).id)?.toString();
                                    const title = (survey.title || survey.surveyName || "").toLowerCase();
                                    const isTeammateSurvey = title.includes("takım arkadaşı");
                                    const alreadySubmitted =
                                      surveyId && submittedSurveyIds.has(surveyId);

                                    return (
                                      <>
                                        {!alreadySubmitted && (
                                          <button
                                            className="btn btn-primary"
                                            onClick={() => handleFillSurveyClick(survey)}
                                          >
                                            Fill Survey
                                          </button>
                                        )}
                                        {alreadySubmitted && (
                                          <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                            Submitted
                                          </span>
                                        )}
                                        <button
                                          className="btn btn-secondary"
                                          onClick={() => handlePreviewClick(survey)}
                                        >
                                          Preview
                                        </button>
                                    {user?.role === "admin" && (
                                      <>
                                            <button
                                              className="btn btn-edit"
                                              onClick={() => handleEditClick(survey)}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="btn btn-delete"
                                              onClick={() => handleDeleteClick(survey)}
                                            >
                                              Delete
                                            </button>
                                      </>
                                    )}
                                      </>
                                    );
                                  })()}
                                </div>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>

          {/* New Survey Form */}
          {isFormOpen && (
            <NewSurveyForm
              onClose={() => setIsFormOpen(false)}
              onSave={handleSaveSurvey}
            />
          )}

          {/* Edit Survey Form */}
          {editingSurvey && (
            <EditSurveyForm
              survey={editingSurvey}
              onClose={() => setEditingSurvey(null)}
              onSave={handleUpdateSurvey}
            />
          )}

          {/* Survey Preview */}
          {previewingSurvey && (
            <SurveyPreview
              survey={previewingSurvey}
              onClose={() => setPreviewingSurvey(null)}
            />
          )}

          {/* Delete Confirmation Survey */}
          {deletingSurvey && (
              <DeleteConfirmation
                  onConfirm={handleConfirmDelete}
                  onClose={handleCloseDeleteModal}
                  message="Are you sure you want to delete this survey?"
              />
            )}

          {/* Survey Form - Fill Survey */}
          {fillingSurvey && (
            <SurveyForm
              survey={fillingSurvey}
              onClose={() => setFillingSurvey(null)}
              onSubmit={handleSurveyFormSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
