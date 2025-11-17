"use client";

import React, { useState, useEffect } from 'react';
import './NewSurveyForm.css';
import "../../components/buttons.css";

interface NewSurveyFormProps {
    onClose: () => void;
    onSave: (surveyData: any) => void;
}

/* ----------------- Types ------------------ */
interface FormErrors {
    missingName?: string;
    missingCategory?: string;
}
/*-------------------------------------------*/

const initialCategories = [     // Dummy data for categories that will be replaced with the actual categories
  { id: 1, name: "Potential" },
  { id: 2, name: "Culture Harmony" },
  { id: 3, name: "Team Effect" },
  { id: 4, name: "Executive Observation" },
];

export default function NewSurveyForm({ onClose, onSave }: NewSurveyFormProps) {
  const [surveyName, setSurveyName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000); // Clear errors after 5 seconds
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
  
  const handleSave = () => {
    const newErrors: FormErrors = {};

    if (!surveyName.trim()) {   // If survey name is empty, set the error message
        newErrors.missingName = "Survey name cannot be empty.";
    }
    if (selectedCategories.length === 0) {   // If survey category is not selected, set the error message
        newErrors.missingCategory = "Survey category cannot be empty.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        return;
    }

    const categoryNames = selectedCategories.map(id => {
        const category = initialCategories.find(c => c.id === id);
        return category ? category.name : "";
    }).filter(Boolean);

    const surveyData = {
        surveyName: surveyName,
        categories: categoryNames,
        startDate: new Date().toISOString().split('T')[0],
        endDate: deadline,
        status: 'Active',
    };
    onSave(surveyData);
    onClose();
  };

  return (
    <div className="new-survey-overlay">
      <div className="new-survey-content new-survey-modal">
        <div className="new-survey-header">
          <h2 className="new-survey-title">New Survey</h2>
          <button onClick={onClose} className="new-survey-close-button">&times;</button>
        </div>
        <div className="new-survey-body form-layout">
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
                        className={`category-item draggable ${selectedCategories.includes(category.id) ? 'selected' : ''}`} // Adds "selected" only if the category’s ID is in the selectedCategories array.
                        draggable={!selectedCategories.includes(category.id)} // Makes the category draggable only if it’s not already selected.
                        onDragStart={(e) => handleDragStart(e, category.id)}
                    >
                      {category.name}
                    </div>
                ))}
                </div>
            </div>
        </div>
        <div className="new-survey-footer">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save
            </button>
        </div>
      </div>
    </div>
  );
}
