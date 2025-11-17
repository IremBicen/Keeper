"use client";

import { useState, useEffect } from 'react';
import './EditSurveyForm.css';
import "../../components/buttons.css";
import { Survey } from '../../hooks/useMockData';

interface EditSurveyFormProps {
    survey: Survey;
    onClose: () => void;
    onSave: (surveyData: Survey) => void;
}

interface FormErrors {
    missingName?: string;
    missingCategory?: string;
}

const initialCategories = [ // Dummy data for categories that will be replaced with the actual categories
  { id: 1, name: "Potential" },
  { id: 2, name: "Culture Harmony" },
  { id: 3, name: "Team Effect" },
  { id: 4, name: "Executive Observation" },
];

export default function EditSurveyForm({ survey, onClose, onSave }: EditSurveyFormProps) {
  const [surveyName, setSurveyName] = useState(survey.surveyName);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [deadline, setDeadline] = useState(survey.endDate);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => { // Getting the category ids from the survey category
    const categoryIds = survey.categories.map(name => {
        const category = initialCategories.find(c => c.name === name);
        return category ? category.id : null;
    }).filter((id): id is number => id !== null);
    setSelectedCategories(categoryIds);
  }, [survey]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) { // If there are any errors, show the error message for 5 seconds
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, categoryId: number) => {
    e.dataTransfer.setData("categoryId", categoryId.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const categoryId = parseInt(e.dataTransfer.getData("categoryId"), 10);
    if (categoryId && !selectedCategories.includes(categoryId)) {
      setSelectedCategories(prev => [...prev, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
  };
  
  const handleSave = () => { // Saving the survey data to the database
    const newErrors: FormErrors = {};

    if (!surveyName.trim()) { // If the survey name is empty, show the error message
        newErrors.missingName = "Survey name cannot be empty.";
    }
    if (selectedCategories.length === 0) { // If the survey category is empty, show the error message
        newErrors.missingCategory = "Survey category cannot be empty.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) { // If there are any errors, do not save the survey data to the database
        return;
    }

    const categoryNames = selectedCategories.map(id => {
        return initialCategories.find(c => c.id === id)?.name || "";
    });

    const surveyData = {
        ...survey,
        surveyName: surveyName,
        categories: categoryNames,
        endDate: deadline,
    };
    onSave(surveyData);
    onClose();
  };

  return (
    <div className="edit-survey-overlay">
      <div className="edit-survey-content">
        <div className="edit-survey-header">
          <h2 className="edit-survey-title">Edit Survey</h2>
          <button onClick={onClose} className="edit-survey-close-button">&times;</button>
        </div>
        <div className="edit-survey-body form-layout">
            <div className="left-side">
                <div className="survey-details">
                    <label htmlFor="surveyName">Survey Name *</label>
                    <input
                        type="text"
                        id="surveyName"
                        value={surveyName}
                        onChange={(e) => setSurveyName(e.target.value)}
                        placeholder="Enter survey name"
                    />
                    {errors.missingName && <p className="error-message">{errors.missingName}</p>}
                </div>
                <div className="survey-details">
                    <label htmlFor="deadline">Deadline (Optional)</label>
                    <input
                        type="date"
                        id="deadline"
                        className="date-input"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </div>
                <div className="survey-category" onDragOver={handleDragOver} onDrop={handleDrop}>
                    <label>Survey Category *</label>
                    <div className="drop-zone">
                        {selectedCategories.length > 0 ? (
                            selectedCategories.map(id => {
                                const category = initialCategories.find(c => c.id === id);
                                return (
                                    <div 
                                        key={id} 
                                        className="dropped-category"
                                        onClick={() => handleRemoveCategory(id)}
                                    >
                                        {category?.name}
                                    </div>
                                );
                            })
                        ) : (
                            <p>Drag and drop category here.</p>
                        )}
                    </div>
                    {errors.missingCategory && <p className="error-message">{errors.missingCategory}</p>}
                 </div>
              </div>
            <div className="right-side">
                <h3>Category Types</h3>
                <div className="category-list">
                {initialCategories.map(category => (
                    <div
                        key={category.id}
                        className={`category-item draggable ${selectedCategories.includes(category.id) ? 'selected' : ''}`} // If the category is selected, add the selected class for styling
                        draggable={!selectedCategories.includes(category.id)}
                        onDragStart={(e) => handleDragStart(e, category.id)}
                    >
                      {category.name}
                    </div>
                ))}
                </div>
            </div>
        </div>
        <div className="edit-survey-footer">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save Changes
            </button>
        </div>
      </div>
    </div>
  );
}
