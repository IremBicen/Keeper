"use client";

import { useState } from "react";
import "../Dashboard.css";
import "./surveys.css";
import NewSurveyForm from "./newSurveyForm/NewSurveyForm";
import Notification from "../components/notification/Notification";
import DeleteConfirmation from "../components/deleteConfirmation/DeleteConfirmation";
import EditSurveyForm from "./editSurveyForm/EditSurveyForm";
import SurveyPreview from "./surveyPreview/SurveyPreview";
import { useMockData, Survey, formatDate } from "../hooks/useMockData";
import { Sidebar } from "../components/sidebar/Sidebar";
import "../components/table.css";
import "../components/buttons.css";

export default function SurveysPage() {
  const {
    managementSurveys,
    addSurvey,
    updateSurvey,
    deleteSurvey,
  } = useMockData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [previewingSurvey, setPreviewingSurvey] = useState<Survey | null>(null);

  const handleEditClick = (survey: Survey) => {
    setEditingSurvey(survey);
  };

  const handlePreviewClick = (survey: Survey) => {
    setPreviewingSurvey(survey);
  };

  const handleDeleteClick = (survey: Survey) => {
    setDeletingSurvey(survey);
  };

  const handleCloseDeleteModal = () => {
    setDeletingSurvey(null);
  };

  const handleConfirmDelete = () => { // Confirming the deletion of the survey database parameters (But it will not be deleted from the database)
    if (deletingSurvey) {
      deleteSurvey(deletingSurvey.id);
      setNotification("Survey successfully deleted!");
      handleCloseDeleteModal();
    }
  };

  //---------------------Save Survey Functionality---------------------
  const handleSaveSurvey = (surveyData: any) => { // API will be called to save the survey
    addSurvey(surveyData);
    setIsFormOpen(false);
    setNotification("Survey successfully added!");
  };

  //---------------------Update Survey Functionality---------------------
  const handleUpdateSurvey = (updatedSurvey: Survey) => { // API will be called to update the survey
    updateSurvey(updatedSurvey);
    setNotification("Survey successfully updated!");
    setEditingSurvey(null);
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
            <button
              className="btn btn-primary"
              onClick={() => setIsFormOpen(true)}
            >
              + New Survey
            </button>
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
                    {managementSurveys.map((survey, index) => (
                        <tr key={survey.id}>
                            <td>{index + 1}</td>
                            <td>{survey.surveyName}</td>
                            <td>{survey.categories.join(', ')}</td>
                            <td>{formatDate(survey.startDate, '')}</td>
                            <td>{formatDate(survey.endDate, '')}</td>
                            <td>{survey.responses}</td>
                            <td>
                                <button className="btn btn-secondary" onClick={() => handlePreviewClick(survey)}>Preview</button>
                                <button className="btn btn-edit" onClick={() => handleEditClick(survey)}>Edit</button>
                                <button className="btn btn-delete" onClick={() => handleDeleteClick(survey)}>Delete</button>
                            </td>
                        </tr>
                    ))}
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
        </div>
      </main>
    </div>
  );
}
