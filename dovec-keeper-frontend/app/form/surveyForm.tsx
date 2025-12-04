"use client";

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { Survey } from '../types/survey';
import { Category } from '../types/category';
import { Subcategory } from '../types/subcategory';
import './surveyForm.css';
import '../components/buttons.css';

interface SurveyFormProps {
    survey: Survey;
    onClose: () => void;
    onSubmit: (survey: Survey, status: "Submitted" | "Draft", answers: any[], selectedId?: string) => void;
}

interface CategoryWithSubcategories extends Category {
    subcategories: Subcategory[];
}

interface Teammate {
    _id: string;
    id?: string;
    name: string;
    email: string;
    department?: string;
    departments?: string[];
    role?: string;
}

export default function SurveyForm({ survey, onClose, onSubmit }: SurveyFormProps) {
    const { user, token } = useUser();
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>([]);
    const surveyCategories = survey.categories;
    const [errors, setErrors] = useState<{ ratings?: string; teammate?: string; manager?: string }>({});
    const [ratings, setRatings] = useState<{ [key: string]: number }>({});
    const [textAnswers, setTextAnswers] = useState<{ [key: string]: string }>({});
    const [loadingSubcategories, setLoadingSubcategories] = useState(true);
    
    // Teammate/Manager selection states
    const isTeammateSurvey = survey.title?.toLowerCase().includes('takım arkadaşı') || survey.surveyName?.toLowerCase().includes('takım arkadaşı');
    const isManagerSurvey = survey.title?.toLowerCase().includes('yönetici') || survey.surveyName?.toLowerCase().includes('yönetici');
    const [teammates, setTeammates] = useState<Teammate[]>([]);
    const [managers, setManagers] = useState<Teammate[]>([]);
    const [selectedTeammateId, setSelectedTeammateId] = useState<string>('');
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [loadingTeammates, setLoadingTeammates] = useState(false);
    const [loadingManagers, setLoadingManagers] = useState(false);

    // Shared role ranking logic (higher number = higher level)
    const roleRank: Record<string, number> = {
        employee: 1,
        manager: 2,
        coordinator: 3,
        director: 4,
        admin: 99,
    };

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
    const handleRatingChange = (subcategoryId: string, rating: number) => {
        setRatings(prevRatings => {
            const newRatings = { ...prevRatings, [subcategoryId]: rating };

            // Calculate total subcategories from all categories
            const totalSubcategories = categoriesWithSubcategories.reduce(
                (total, cat) => total + cat.subcategories.length, 
                0
            );
            
            const answeredCount = Object.keys(newRatings).length + Object.keys(textAnswers).length;

            if (answeredCount === totalSubcategories) {
                setErrors(prevErrors => {
                    const { ratings, ...rest } = prevErrors;
                    return rest;
                });
            }
            return newRatings;
        });
    };
    
    const handleTextChange = (subcategoryId: string, value: string) => {
        setTextAnswers(prev => {
            const newText = { ...prev, [subcategoryId]: value };

            const totalSubcategories = categoriesWithSubcategories.reduce(
                (total, cat) => total + cat.subcategories.length, 
                0
            );

            const answeredCount = Object.keys(ratings).length + Object.keys(newText).length;

            if (answeredCount === totalSubcategories) {
                setErrors(prevErrors => {
                    const { ratings, ...rest } = prevErrors;
                    return rest;
                });
            }

            return newText;
        });
    };
    
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
                setLoadingSubcategories(false);
                return;
            }

            try {
                setLoadingSubcategories(true);
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
                setLoadingSubcategories(false);
            }
        };

        fetchSubcategories();
    }, [token, categoryList, surveyCategories]);

    // Fetch teammates for "takım arkadaşı" surveys
    useEffect(() => {
        const fetchTeammates = async () => {
            if (!isTeammateSurvey || !token || !user) return;
            
            try {
                setLoadingTeammates(true);
                const res = await api.get<Teammate[]>("/users?forEvaluation=true", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // Filter teammates: same department, exclude self, only employees (no managers)
                const allUsers = res.data || [];
                const userDepartment = user.department || (user as any)?.department;
                
                // Debug logging
                console.log("User department:", userDepartment);
                console.log("All users from API:", allUsers);
                console.log("Users with departments:", allUsers.map((u: Teammate) => ({ 
                    name: u.name, 
                    department: u.department, 
                    role: u.role 
                })));
                
                const filtered = allUsers.filter((u: Teammate) => {
                    const userId = (user as any)?.id?.toString() || (user as any)?._id?.toString();
                    const uId = u._id?.toString() || u.id?.toString();
                    
                    // Normalize department strings (trim, lowercase for comparison)
                    const userDept = (userDepartment || '').toString().trim().toLowerCase();
                    const teammateDept = (u.department || '').toString().trim().toLowerCase();
                    
                    const isSameDepartment = userDept === teammateDept && userDept !== '';
                    const isNotSelf = uId !== userId;
                    const isValidRole = u.role === 'employee'; // only employees can be evaluated in teammate surveys
                    
                    return isSameDepartment && isNotSelf && isValidRole;
                });
                
                console.log("Filtered teammates:", filtered);
                setTeammates(filtered);
            } catch (err) {
                console.error("Error fetching teammates:", err);
                setTeammates([]);
            } finally {
                setLoadingTeammates(false);
            }
        };
        
        fetchTeammates();
    }, [isTeammateSurvey, token, user]);

    // Fetch managers for "yönetici" surveys
    useEffect(() => {
        const fetchManagers = async () => {
            if (!isManagerSurvey || !token || !user) return;
            
            try {
                setLoadingManagers(true);
                const res = await api.get<Teammate[]>("/users?forEvaluation=true", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // Filter only superiors (higher roles) that share at least one department
                const allUsers = res.data || [];
                const currentRole = ((user as any)?.role || '').toString().toLowerCase();
                const currentRank = roleRank[currentRole] || 0;
                const userDepartment = (user as any)?.department || (user as any)?.department;

                const filtered = allUsers.filter((u: Teammate) => {
                    const targetRole = (u.role || '').toString().toLowerCase();
                    const targetRank = roleRank[targetRole] || 0;

                    // Normalize department strings (trim, lowercase for comparison)
                    const userDept = (userDepartment || '').toString().trim().toLowerCase();
                    const targetDepts: string[] = [
                        (u.department || '').toString().trim().toLowerCase(),
                        ...(Array.isArray(u.departments)
                            ? u.departments.map((d) => d.toString().trim().toLowerCase())
                            : []),
                    ].filter(Boolean);

                    const isSameDepartment =
                        userDept !== '' && targetDepts.includes(userDept);

                    const userId = (user as any)?.id?.toString() || (user as any)?._id?.toString();
                    const uId = u._id?.toString() || u.id?.toString();
                    const isNotSelf = uId !== userId;

                    // Role-based visibility:
                    // - Employee -> only manager
                    // - Manager -> director or coordinator
                    // - Coordinator -> director
                    // - Director -> none
                    let isAllowedByRole = false;
                    if (currentRole === 'employee') {
                        isAllowedByRole = targetRole === 'manager';
                    } else if (currentRole === 'manager') {
                        isAllowedByRole = targetRole === 'coordinator' || targetRole === 'director';
                    } else if (currentRole === 'coordinator') {
                        isAllowedByRole = targetRole === 'director';
                    } else if (currentRole === 'director') {
                        isAllowedByRole = false;
                    }

                    return isSameDepartment && isNotSelf && isAllowedByRole;
                });
                
                // Sort by department, then by name
                filtered.sort((a, b) => {
                    const deptA = a.department || '';
                    const deptB = b.department || '';
                    if (deptA !== deptB) {
                        return deptA.localeCompare(deptB);
                    }
                    return (a.name || '').localeCompare(b.name || '');
                });
                
                setManagers(filtered);
            } catch (err) {
                console.error("Error fetching managers:", err);
                setManagers([]);
            } finally {
                setLoadingManagers(false);
            }
        };
        
        fetchManagers();
    }, [isManagerSurvey, token, user]);

    //--------------Draft Handling--------------------------
    useEffect(() => {
        const surveyId = survey._id || survey.id;
        if (surveyId) {
            const savedDraft = localStorage.getItem(`survey_draft_${surveyId}`);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed && typeof parsed === "object" && ("ratings" in parsed || "textAnswers" in parsed)) {
                        setRatings(parsed.ratings || {});
                        setTextAnswers(parsed.textAnswers || {});
                    } else {
                        // backwards compatibility with old format (just ratings map)
                        setRatings(parsed);
                    }
                } catch {
                    // ignore invalid draft
                }
            }
        }
    }, [survey._id, survey.id]);

    //--------------Submit Handling--------------------------
    const handleSubmit = (status: "Submitted" | "Draft") => {
        const newErrors: { ratings?: string; teammate?: string; manager?: string } = {};

        // Validate teammate/manager selection for submitted surveys
        if (status === 'Submitted') {
            if (isTeammateSurvey && !selectedTeammateId) {
                newErrors.teammate = "Please select a teammate to evaluate.";
            }
            if (isManagerSurvey && !selectedManagerId) {
                newErrors.manager = "Please select a manager to evaluate.";
            }
        }

        if (status === 'Draft') {   // For drafts, just save and close without validation
            localStorage.setItem(
                `survey_draft_${survey._id || survey.id}`,
                JSON.stringify({ ratings, textAnswers })
            );
            // Still submit as draft to backend
            const answers = [
                ...Object.entries(ratings).map(([key, value]) => ({
                    questionId: key,
                    value: value
                })),
                ...Object.entries(textAnswers).map(([key, value]) => ({
                    questionId: key,
                    value: value
                })),
            ];
            const selectedId = selectedTeammateId || selectedManagerId;
            onSubmit(survey, status, answers, selectedId);
            return;
        }

        if (status === 'Submitted') {   // For completion, validate the form
            // Calculate total subcategories
            const totalSubcategories = categoriesWithSubcategories.reduce(
                (total, cat) => total + cat.subcategories.length, 
                0
            );
            
            const answeredCount = Object.keys(ratings).length + Object.keys(textAnswers).length;

            if (totalSubcategories > 0) {
                if (answeredCount < totalSubcategories) {
                    newErrors.ratings = "Please answer all questions.";
                }
            } else if (answeredCount === 0) {
                newErrors.ratings = "Please answer at least one question.";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            // Convert ratings / text answers to answers format for backend
            const answers = [
                ...Object.entries(ratings).map(([subcategoryId, value]) => ({
                    questionId: subcategoryId,
                    value: value
                })),
                ...Object.entries(textAnswers).map(([subcategoryId, value]) => ({
                    questionId: subcategoryId,
                    value: value
                })),
            ];
            
            // If submission is successful, remove any saved draft
            localStorage.removeItem(`survey_draft_${survey._id || survey.id}`);
            const selectedId = selectedTeammateId || selectedManagerId;
            onSubmit(survey, status, answers, selectedId);   // Calls the onSubmit function to submit the survey
        }
    };

    return (
        <div className="form-container">
            <div className="form-content">
                <div className="form-header">
                    <h2 className="form-title">{survey.title || survey.surveyName}</h2>
                    <button onClick={onClose} className="cancel-button-standalone">Cancel</button>
                </div>
                <div className="form-header-info">
                    <div>
                        <h3>Name: <span>{user?.name || 'N/A'}</span></h3>
                        <h3>Email: <span>{user?.email || 'N/A'}</span></h3>
                    </div>
                </div>
                <div className="form-body">
                    <div className="dates-section">
                        <div className="start-date">
                            <h3>Start Date</h3>
                            <p>{survey.startDate ? new Date(survey.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="end-date">
                            <h3>End Date</h3>
                            <p>{survey.endDate ? new Date(survey.endDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    {/* Teammate Selection for "takım arkadaşı" surveys */}
                    {isTeammateSurvey && (
                        <div className="teammate-selection-section">
                            <label htmlFor="teammate-select" className="teammate-label">
                                Select Teammate to Evaluate <span className="required-asterisk">*</span>
                            </label>
                            {loadingTeammates ? (
                                <p>Loading teammates...</p>
                            ) : teammates.length === 0 ? (
                                <p className="error-message">No teammates found in your department.</p>
                            ) : (
                                <select
                                    id="teammate-select"
                                    value={selectedTeammateId}
                                    onChange={(e) => setSelectedTeammateId(e.target.value)}
                                    className="teammate-select"
                                >
                                    <option value="">-- Select Teammate --</option>
                                    {teammates.map((teammate) => (
                                        <option key={teammate._id || teammate.id} value={teammate._id || teammate.id}>
                                            {teammate.name} ({teammate.email}) - {teammate.department || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.teammate && <p className="error-message">{errors.teammate}</p>}
                        </div>
                    )}

                    {/* Manager Selection for "yönetici" surveys */}
                    {isManagerSurvey && (
                        <div className="teammate-selection-section">
                            <label htmlFor="manager-select" className="teammate-label">
                                Select Superior to Evaluate <span className="required-asterisk">*</span>
                            </label>
                            {loadingManagers ? (
                                <p>Loading managers...</p>
                            ) : managers.length === 0 ? (
                                <p className="error-message">No managers found.</p>
                            ) : (
                                <select
                                    id="manager-select"
                                    value={selectedManagerId}
                                    onChange={(e) => setSelectedManagerId(e.target.value)}
                                    className="teammate-select"
                                >
                                    <option value="">-- Select Manager --</option>
                                    {managers.map((manager) => (
                                        <option key={manager._id || manager.id} value={manager._id || manager.id}>
                                            {manager.name} ({manager.email}) - {manager.department || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.manager && <p className="error-message">{errors.manager}</p>}
                        </div>
                    )}

                    <div className="categories-section">
                        {loadingSubcategories ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p>Loading questions...</p>
                            </div>
                        ) : (
                            <div className="categories-container">
                                {categoriesWithSubcategories.length > 0 ? (
                                    categoriesWithSubcategories.map((category) => (
                                        <div key={category._id} className="category-box">
                                            <h4 className="category-title">{category.name}</h4>
                                            {category.subcategories.length > 0 ? (
                                                <div className="subcategories-list">
                                                    {category.subcategories.map((subcategory) => {
                                                        const isTextQuestion = subcategory.type === "text";

                                                        if (isTextQuestion) {
                                                            return (
                                                                <div key={subcategory._id} className="subcategory-item">
                                                                    <p className="subcategory-name">{subcategory.name}</p>
                                                                    <textarea
                                                                        className="short-answer-input"
                                                                        value={textAnswers[subcategory._id] || ""}
                                                                        onChange={(e) => handleTextChange(subcategory._id, e.target.value)}
                                                                        placeholder="Type your answer..."
                                                                    />
                                                                </div>
                                                            );
                                                        }

                                                        const minRating = subcategory.minRating ?? 1;
                                                        const maxRating = subcategory.maxRating ?? 5;
                                                        const ratingOptions = [];
                                                        for (let i = minRating; i <= maxRating; i++) {
                                                            ratingOptions.push(i);
                                                        }
                                                        
                                                        return (
                                                            <div key={subcategory._id} className="subcategory-item">
                                                                <p className="subcategory-name">{subcategory.name}</p>
                                                                <div className="rating-group">
                                                                    {ratingOptions.map(rating => (
                                                                        <label key={rating} className="rating-label">
                                                                            <input
                                                                                type="radio"
                                                                                name={`subcategory-${subcategory._id}`}
                                                                                value={rating}
                                                                                checked={ratings[subcategory._id] === rating}
                                                                                onChange={() => handleRatingChange(subcategory._id, rating)}
                                                                            />
                                                                            {rating}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#71717a', padding: '1rem' }}>
                                                    No questions (subcategories) available for this category.
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : survey.questions && survey.questions.length > 0 ? (
                                    // Fallback: use survey questions if no categories with subcategories
                                    survey.questions.map((question, index) => (
                                        <div key={question.id || index} className="category-box">
                                            <h4 className="category-title">{question.text}</h4>
                                            <div className="subcategories-list">
                                                <div className="subcategory-item">
                                                    <p className="subcategory-name">{question.text}</p>
                                                    <div className="rating-group">
                                                        {[1, 2, 3, 4, 5].map(rating => (
                                                            <label key={rating} className="rating-label">
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question.id || index}`}
                                                                    value={rating}
                                                                    checked={ratings[`question-${question.id || index}`] === rating}
                                                                    onChange={() => handleRatingChange(`question-${question.id || index}`, rating)}
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