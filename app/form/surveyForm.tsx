"use client";

import { useState, useEffect } from 'react';
import { Survey, useMockData, formatDate } from '../hooks/useMockData';
import './surveyForm.css';
import '../components/buttons.css';

interface SurveyFormProps {
    survey: Survey;
    onClose: () => void;
    onSubmit: (survey: Survey, status: "Submitted" | "Draft") => void;
}

export default function SurveyForm({ survey, onClose, onSubmit }: SurveyFormProps) {
    const { categoriesWithSubcategories, user } = useMockData();
    const categories = survey.categories;
    const [errors, setErrors] = useState<{ ratings?: string }>({});
    const [ratings, setRatings] = useState<{ [key: string]: number }>({});

    //--------------Error Handling--------------------------
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const timer = setTimeout(() => {    // If there are any errors, show the error message for 5 seconds
                setErrors({});
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    //--------------Rating Change Handling--------------------------
    const handleRatingChange = (category: string, subcategory: string, rating: number) => { // Runs every single time a user clicks a radio button to select a rating for a subcategory
        const key = `${category}-${subcategory}`; // Ex: "Culture Harmony-Collaboration"
        setRatings(prevRatings => {
            const newRatings = { ...prevRatings, [key]: rating };

            const totalSubcategories = survey.categories.reduce((acc, catName) => { // Calculates the total number of subcategories in the survey
                const category = categoriesWithSubcategories.find(c => c.name === catName);
                return acc + (category ? category.subcategories.length : 0);
            }, 0);
            if (Object.keys(newRatings).length === totalSubcategories) { // If the number of ratings is equal to the total number of subcategories means the user has rated all subcategories
                setErrors(prevErrors => {
                    const { ratings, ...rest } = prevErrors;
                    return rest;
                });
            }
            return newRatings;
        });
    };
    
    //--------------Draft Handling--------------------------
    useEffect(() => {
        const savedDraft = localStorage.getItem(`survey_draft_${survey.id}`);
        if (savedDraft) {
            setRatings(JSON.parse(savedDraft));
        }
    }, [survey.id]);

    //--------------Submit Handling--------------------------
    const handleSubmit = (status: "Submitted" | "Draft") => {
        const newErrors: { ratings?: string } = {};

        if (status === 'Draft') {   // For drafts, just save and close without validation
            localStorage.setItem(`survey_draft_${survey.id}`, JSON.stringify(ratings));
            onClose();
            return;
        }

        if (status === 'Submitted') {   // For completion, validate the form
            const totalSubcategories = survey.categories.reduce((acc, catName) => {
                const category = categoriesWithSubcategories.find(c => c.name === catName);
                return acc + (category ? category.subcategories.length : 0);
            }, 0);
            if (Object.keys(ratings).length < totalSubcategories) {
                newErrors.ratings = "Please provide a rating for all subcategories.";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            // If submission is successful, remove any saved draft
            localStorage.removeItem(`survey_draft_${survey.id}`);
            onSubmit(survey, status);   // Calls the onSubmit function to submit the survey
        }
    };

    return (
        <div className="form-container">
            <div className="form-content">
                <div className="form-header">
                    <h2 className="form-title">{survey.surveyName}</h2>
                    <button onClick={onClose} className="cancel-button-standalone">Cancel</button>
                </div>
                <div className="form-header-info">
                    <div>
                        <h3>Name: <span>{user.name}</span></h3>
                        <h3>Department: <span>{user.department}</span></h3>
                        <h3>Email: <span>{user.email}</span></h3>
                    </div>
                    <img src={user.profilePicture} alt="Profile" />
                </div>
                <div className="form-body">
                    <div className="dates-section">
                        <div className="start-date">
                            <h3>Start Date</h3>
                            <p>{formatDate(survey.startDate)}</p>
                        </div>
                        <div className="end-date">
                            <h3>End Date</h3>
                            <p>{formatDate(survey.endDate)}</p>
                        </div>
                    </div>
                    <div className="categories-section">
                        <div className="categories-container">
                            {categories.map((category, index) => (
                                <div key={index} className="category-box">
                                    <h4 className="category-title">{category}</h4>
                                    <div className="subcategories-list">
                                        {(categoriesWithSubcategories.find(c => c.name === category)?.subcategories || []).map((subcategory) => (
                                            <div key={subcategory.id} className="subcategory-item">
                                                <p className="subcategory-name">{subcategory.name}</p>
                                                <div className="rating-group">
                                                    {[1, 2, 3, 4, 5].map(rating => (
                                                        <label key={rating} className="rating-label">
                                                            <input
                                                                type="radio"
                                                                name={`${category}-${subcategory.name}`}
                                                                value={rating}
                                                                checked={ratings[`${category}-${subcategory.name}`] === rating}
                                                                onChange={() => handleRatingChange(category, subcategory.name, rating)}
                                                            />
                                                            {rating}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {errors.ratings && <p className="error-message ratings-error">{errors.ratings}</p>}
                <div className="form-footer">
                    <button
                        type="button"
                        className="btn btn-neutral"
                        onClick={() => handleSubmit('Draft')}
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => handleSubmit('Submitted')}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}