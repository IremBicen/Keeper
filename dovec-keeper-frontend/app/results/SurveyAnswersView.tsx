"use client";

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { Subcategory } from '../types/subcategory';
import { Category } from '../types/category';
import './surveyAnswersView.css';
import '../form/surveyForm.css';

interface Answer {
  questionId: string;
  value: any;
}

interface Response {
  _id: string;
  survey: {
    _id: string;
    title: string;
    surveyName?: string;
    categories: string[];
    startDate?: string;
    endDate?: string;
  };
  employee: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  answers: Answer[];
  status: string;
  submittedAt?: string;
}

interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

interface SurveyAnswersViewProps {
  surveyId: string;
  employeeId: string;
  onClose: () => void;
}

export default function SurveyAnswersView({
  surveyId,
  employeeId,
  onClose
}: SurveyAnswersViewProps) {
  const [response, setResponse] = useState<Response | null>(null);
  const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch response with answers
        const responseRes = await api.get<Response>(`/responses/${surveyId}/${employeeId}`);
        setResponse(responseRes.data);

        // Fetch all categories
        const categoriesRes = await api.get<Category[]>('/categories');
        const allCategories = categoriesRes.data;

        // Fetch subcategories for each category in the survey
        const surveyCategories = responseRes.data.survey.categories || [];
        const categoriesWithSubs: CategoryWithSubcategories[] = [];

        for (const categoryNameOrId of surveyCategories) {
          // Find category by name or ID
          const category = allCategories.find(
            cat => cat.name === categoryNameOrId || cat._id === categoryNameOrId
          );

          if (category) {
            try {
              // Fetch subcategories for this category
              const subcategoriesRes = await api.get<Subcategory[]>(
                `/subcategories/category/${category._id}`
              );
              categoriesWithSubs.push({
                ...category,
                subcategories: subcategoriesRes.data || []
              });
            } catch (err) {
              console.error(`Error fetching subcategories for category ${category._id}:`, err);
              categoriesWithSubs.push({
                ...category,
                subcategories: []
              });
            }
          }
        }

        setCategoriesWithSubcategories(categoriesWithSubs);
      } catch (err: any) {
        console.error("Error fetching response data:", err);
        setError(err.response?.data?.message || "Failed to load survey answers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [surveyId, employeeId]);

  // Create a map of questionId to answer value
  const answerMap = new Map<string, any>();
  response?.answers.forEach(answer => {
    answerMap.set(answer.questionId, answer.value);
  });

  if (loading) {
    return (
      <div className="survey-answers-overlay" onClick={onClose}>
        <div className="survey-answers-content" onClick={(e) => e.stopPropagation()}>
          <div className="survey-answers-header">
            <h2>Survey Answers</h2>
            <button onClick={onClose} className="close-button">&times;</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#d1d5db' }}>
            <p>Loading answers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="survey-answers-overlay" onClick={onClose}>
        <div className="survey-answers-content" onClick={(e) => e.stopPropagation()}>
          <div className="survey-answers-header">
            <h2>Survey Answers</h2>
            <button onClick={onClose} className="close-button">&times;</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#fca5a5' }}>
            <p>{error || "No response data found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const survey = response.survey;
  const employee = response.employee;

  return (
    <div className="survey-answers-overlay" onClick={onClose}>
      <div className="survey-answers-content" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">{survey.title || survey.surveyName || 'Survey'}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        {/* Header Info Section */}
        <div className="form-header-info">
          <div>
            <h3>Employee: <span>{employee.name}</span></h3>
            <h3>Email: <span>{employee.email}</span></h3>
            <h3>Department: <span>{employee.department || 'N/A'}</span></h3>
          </div>
        </div>

        {/* Dates Section */}
        {(survey.startDate || survey.endDate) && (
          <div className="dates-section">
            {survey.startDate && (
              <div className="start-date">
                <h3>Start Date:</h3>
                <p>{new Date(survey.startDate).toLocaleDateString()}</p>
              </div>
            )}
            {survey.endDate && (
              <div className="end-date">
                <h3>End Date:</h3>
                <p>{new Date(survey.endDate).toLocaleDateString()}</p>
              </div>
            )}
            {response.submittedAt && (
              <div className="end-date">
                <h3>Submitted At:</h3>
                <p>{new Date(response.submittedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Categories and Answers */}
        <div className="form-body">
          <div className="categories-container">
            {categoriesWithSubcategories.map((category) => (
              <div key={category._id} className="category-box">
                <h3 className="category-title">{category.name}</h3>
                {category.subcategories.map((subcategory) => {
                  const answer = answerMap.get(subcategory._id);
                  const minRating = subcategory.minRating || 1;
                  const maxRating = subcategory.maxRating || 5;
                  
                  return (
                    <div key={subcategory._id} className="subcategory-item">
                      <p className="subcategory-name">{subcategory.name}</p>
                      <div className="rating-group">
                        {Array.from({ length: maxRating - minRating + 1 }, (_, i) => {
                          const ratingValue = minRating + i;
                          const isSelected = answer === ratingValue;
                          
                          return (
                            <label
                              key={ratingValue}
                              className="rating-label"
                              style={{
                                cursor: 'default',
                                opacity: isSelected ? 1 : 0.5,
                                fontWeight: isSelected ? '700' : '500',
                                color: isSelected ? '#60a5fa' : '#9ca3af',
                                background: isSelected ? '#1e3a8a' : 'transparent',
                                border: isSelected ? '2px solid #60a5fa' : '2px solid transparent',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                transition: 'all 0.2s',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isSelected ? '0 4px 6px -1px rgba(96, 165, 250, 0.3)' : 'none'
                              }}
                            >
                              <input
                                type="radio"
                                checked={isSelected}
                                readOnly
                                disabled
                                style={{ cursor: 'default', marginRight: '0.5rem' }}
                              />
                              <span style={{ fontSize: '1.125rem' }}>{ratingValue}</span>
                            </label>
                          );
                        })}
                      </div>
                      {answer === undefined || answer === null ? (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          padding: '0.5rem 1rem', 
                          background: '#7f1d1d', 
                          border: '1px solid #991b1b',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          <span style={{ color: '#fca5a5', fontSize: '0.875rem', fontWeight: '500' }}>
                            No answer provided
                          </span>
                        </div>
                      ) : (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          padding: '0.5rem 1rem', 
                          background: '#1e3a8a', 
                          border: '1px solid #3b82f6',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          <span style={{ color: '#93c5fd', fontSize: '0.875rem', fontWeight: '600' }}>
                            ✓ Selected: {answer}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="form-footer">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

