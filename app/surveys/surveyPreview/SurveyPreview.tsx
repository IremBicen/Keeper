"use client";

import './SurveyPreview.css';
import "../../components/buttons.css";
import { Survey, subcategoriesData } from '../../hooks/mockData';

interface SurveyPreviewProps {
    survey: Survey;
    onClose: () => void;
}
/*-------------------------------------------*/

function formatDate(dateString: string) {
    if (!dateString) return '-'; // If the date is not available, show -
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US"); // Format the date to MM/DD/YYYY
}

export default function SurveyPreview({ survey, onClose }: SurveyPreviewProps) {
    const categories = survey.categories;

    return (
        <div className="preview-modal-overlay">
            <div className={`preview-modal-content ${categories.length === 1 ? 'single-item' : ''}`}>
                <div className="preview-modal-header">
                    <h2 className="preview-modal-title">{survey.surveyName}</h2>
                    <button onClick={onClose} className="preview-close-button">&times;</button>
                </div>
                <div className="preview-modal-body">
                    <div className="preview-dates-section">
                        <div className="preview-start-date">
                            <h3>Start Date</h3>
                            <p>{formatDate(survey.startDate)}</p>
                        </div>
                        <div className="preview-end-date">
                            <h3>End Date</h3>
                            <p>{formatDate(survey.endDate)}</p>
                        </div>
                    </div>
                    <div className="preview-categories-section">
                        <div className={`preview-categories-container ${categories.length === 1 ? 'single-item' : ''}`}>
                            {categories.map((category, index) => (
                                <div key={index} className="preview-category-box">
                                    <h4 className="preview-category-title">{category}</h4>
                                    <div className="preview-subcategories-list">
                                        {(subcategoriesData[category] || []).map((subcategory, subIndex) => (
                                            <div key={subIndex} className="preview-subcategory-item">
                                                <p className="preview-subcategory-name">{subcategory}</p>
                                                <div className="preview-rating-group">
                                                    {[1, 2, 3, 4, 5].map(rating => (
                                                        <label key={rating} className="preview-rating-label">
                                                            <input type="radio" name={`${category}-${subcategory}`} value={rating} />
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
                <div className="preview-modal-footer">
                    <button onClick={onClose} className="btn btn-light">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
