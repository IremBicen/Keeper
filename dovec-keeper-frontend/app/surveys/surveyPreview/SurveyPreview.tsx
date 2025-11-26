"use client";

import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useUser } from '../../context/UserContext';
import './SurveyPreview.css';
import "../../components/buttons.css";
import { Survey } from '../../types/survey';
import { Category } from '../../types/category';
import { Subcategory } from '../../types/subcategory';

interface SurveyPreviewProps {
    survey: Survey;
    onClose: () => void;
}

interface CategoryWithSubcategories extends Category {
    subcategories: Subcategory[];
}

function formatDate(dateString: string | Date | undefined) {
    if (!dateString) return '-';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return date.toLocaleDateString("en-US");
    } catch {
        return '-';
    }
}

export default function SurveyPreview({ survey, onClose }: SurveyPreviewProps) {
    const { token } = useUser();
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>([]);
    const [loading, setLoading] = useState(true);
    const surveyCategories = survey.categories;

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            if (!token) return;
            try {
                const res = await api.get<Category[]>("/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCategoryList(res.data);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, [token]);

    // Fetch subcategories for each category in the survey
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!token || !categoryList.length || !surveyCategories.length) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const categoriesWithSubs: CategoryWithSubcategories[] = [];

                // For each category in the survey, find the category object and fetch its subcategories
                for (const categoryNameOrId of surveyCategories) {
                    // Find category by name or ID
                    const category = categoryList.find(
                        cat => cat.name === categoryNameOrId || cat._id === categoryNameOrId
                    );

                    if (category) {
                        try {
                            // Fetch subcategories for this category
                            const subcategoriesRes = await api.get<Subcategory[]>(
                                `/subcategories/category/${category._id}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            categoriesWithSubs.push({
                                ...category,
                                subcategories: subcategoriesRes.data || []
                            });
                        } catch (err) {
                            console.error(`Error fetching subcategories for category ${category.name}:`, err);
                            // Add category with empty subcategories array
                            categoriesWithSubs.push({
                                ...category,
                                subcategories: []
                            });
                        }
                    }
                }

                setCategoriesWithSubcategories(categoriesWithSubs);
            } catch (err) {
                console.error("Error fetching subcategories:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubcategories();
    }, [token, categoryList, surveyCategories]);

    return (
        <div className="preview-modal-overlay">
            <div className={`preview-modal-content ${categoriesWithSubcategories.length === 1 ? 'single-item' : ''}`}>
                <div className="preview-modal-header">
                    <h2 className="preview-modal-title">{survey.title || survey.surveyName}</h2>
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
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p>Loading questions...</p>
                            </div>
                        ) : (
                            <div className={`preview-categories-container ${categoriesWithSubcategories.length === 1 ? 'single-item' : ''}`}>
                                {categoriesWithSubcategories.length > 0 ? (
                                    categoriesWithSubcategories.map((category) => (
                                        <div key={category._id} className="preview-category-box">
                                            <h4 className="preview-category-title">{category.name}</h4>
                                            <div className="preview-subcategories-list">
                                                {category.subcategories.length > 0 ? (
                                                    category.subcategories.map((subcategory) => {
                                                        const minRating = subcategory.minRating || 1;
                                                        const maxRating = subcategory.maxRating || 5;
                                                        const ratingOptions = [];
                                                        for (let i = minRating; i <= maxRating; i++) {
                                                            ratingOptions.push(i);
                                                        }
                                                        
                                                        return (
                                                            <div key={subcategory._id} className="preview-subcategory-item">
                                                                <p className="preview-subcategory-name">{subcategory.name}</p>
                                                                <div className="preview-rating-group">
                                                                    {ratingOptions.map(rating => (
                                                                        <label key={rating} className="preview-rating-label">
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`preview-${subcategory._id}`} 
                                                                                value={rating} 
                                                                                disabled 
                                                                            />
                                                                            {rating}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p style={{ color: '#71717a', padding: '1rem' }}>
                                                        No questions (subcategories) available for this category.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : survey.questions && survey.questions.length > 0 ? (
                                    // Fallback: use survey questions if no categories with subcategories
                                    survey.questions.map((question, index) => (
                                        <div key={question.id || index} className="preview-category-box">
                                            <h4 className="preview-category-title">{question.text}</h4>
                                            <div className="preview-subcategories-list">
                                                <div className="preview-subcategory-item">
                                                    <p className="preview-subcategory-name">{question.text}</p>
                                                    <div className="preview-rating-group">
                                                        {[1, 2, 3, 4, 5].map(rating => (
                                                            <label key={rating} className="preview-rating-label">
                                                                <input 
                                                                    type="radio" 
                                                                    name={`preview-question-${question.id || index}`} 
                                                                    value={rating} 
                                                                    disabled 
                                                                />
                                                                {rating}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>No questions available for this survey.</p>
                                    </div>
                                )}
                            </div>
                        )}
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
