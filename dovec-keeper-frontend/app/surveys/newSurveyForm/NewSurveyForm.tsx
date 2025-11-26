"use client";

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useUser } from '../../context/UserContext';
import { Category } from '../../types/category';
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

interface User {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

export default function NewSurveyForm({ onClose, onSave }: NewSurveyFormProps) {
  const { token, user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [surveyName, setSurveyName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [assignmentType, setAssignmentType] = useState<'all' | 'admins' | 'managers' | 'employees' | 'department' | 'specific'>('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const res = await api.get<Category[]>("/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [token]);

  // Fetch users and departments (admin only)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || user?.role !== 'admin') return;
      try {
        const res = await api.get<User[]>("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
        
        // Extract unique departments
        const uniqueDepartments = Array.from(
          new Set(res.data.map(u => u.department).filter(Boolean) as string[])
        );
        setDepartments(uniqueDepartments);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [token, user]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000); // Clear errors after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, categoryId: string) => {
    e.dataTransfer.setData("categoryId", categoryId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const categoryId = e.dataTransfer.getData("categoryId");
    if (categoryId && !selectedCategories.includes(categoryId)) {
      setSelectedCategories(prev => [...prev, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
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
        const category = categories.find(c => c._id === id);
        return category ? category.name : "";
    }).filter(Boolean);

    // Build assignment data based on assignment type
    let assignmentData: any = {
      assignmentType,
    };

    if (assignmentType === 'department') {
      assignmentData.assignedDepartments = selectedDepartments;
    } else if (assignmentType === 'specific') {
      assignmentData.assignedUsers = selectedUsers;
    } else if (assignmentType === 'managers') {
      assignmentData.assignedRoles = ['manager'];
    } else if (assignmentType === 'employees') {
      assignmentData.assignedRoles = ['employee'];
    }

    const surveyData = {
        title: surveyName,
        categories: categoryNames,
        startDate: new Date().toISOString().split('T')[0],
        endDate: deadline,
        status: 'active' as const,
        questions: [], // Will be added later
        ...assignmentData,
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
                                const category = categories.find(c => c._id === id);
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
                 
                 {/* Assignment Section */}
                 <div className="survey-details assignment-details">
                    <label className="assignment-label">Survey Assignment *</label>
                    <div className="assignment-section">
                        <div className="assignment-options">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="all"
                                    checked={assignmentType === 'all'}
                                    onChange={(e) => setAssignmentType(e.target.value as any)}
                                />
                                <span>All Users</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="managers"
                                    checked={assignmentType === 'managers'}
                                    onChange={(e) => setAssignmentType(e.target.value as any)}
                                />
                                <span>Only Managers</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="employees"
                                    checked={assignmentType === 'employees'}
                                    onChange={(e) => setAssignmentType(e.target.value as any)}
                                />
                                <span>Only Employees</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="department"
                                    checked={assignmentType === 'department'}
                                    onChange={(e) => setAssignmentType(e.target.value as any)}
                                />
                                <span>Specific Department(s)</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="specific"
                                    checked={assignmentType === 'specific'}
                                    onChange={(e) => setAssignmentType(e.target.value as any)}
                                />
                                <span>Specific Individual(s)</span>
                            </label>
                        </div>
                        
                        {/* Department Selection */}
                        {assignmentType === 'department' && (
                            <div className="assignment-selector">
                                <label>Select Departments:</label>
                                <div className="multi-select-container">
                                    {departments.map(dept => (
                                        <label key={dept} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedDepartments.includes(dept)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedDepartments([...selectedDepartments, dept]);
                                                    } else {
                                                        setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                                                    }
                                                }}
                                            />
                                            <span>{dept}</span>
                                        </label>
                                    ))}
                                    {departments.length === 0 && (
                                        <p className="info-text">No departments found. Add departments to user profiles first.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* User Selection */}
                        {assignmentType === 'specific' && (
                            <div className="assignment-selector">
                                <label>Select Users:</label>
                                <div className="multi-select-container">
                                    {users.map(user => (
                                        <label key={user._id} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers([...selectedUsers, user._id]);
                                                    } else {
                                                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                    }
                                                }}
                                            />
                                            <span>{user.name} ({user.email})</span>
                                        </label>
                                    ))}
                                    {users.length === 0 && (
                                        <p className="info-text">No users found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
            <div className="right-side">
                <h3>Category Types</h3>
                <div className="category-list">
                {categories.map(category => (
                    <div
                        key={category._id}
                        className={`category-item draggable ${selectedCategories.includes(category._id) ? 'selected' : ''}`} // Adds "selected" only if the category's ID is in the selectedCategories array.
                        draggable={!selectedCategories.includes(category._id)} // Makes the category draggable only if it's not already selected.
                        onDragStart={(e) => handleDragStart(e, category._id)}
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
