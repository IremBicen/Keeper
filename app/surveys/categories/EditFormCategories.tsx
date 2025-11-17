"use client";

import React, { useState, useEffect } from 'react';
import './categories.css';
import '../../components/buttons.css';
import { Category } from "../../hooks/useMockData"; // Import the centralized Category type

interface EditFormProps {
  category: Category;
  onSave: (updatedCategory: Category) => void;
  onClose: () => void;
}

export default function EditForm({
  category,
  onSave,
  onClose,
}: EditFormProps) {
  const [formData, setFormData] = useState<Category>(category);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  useEffect(() => {  // Clearing the error message after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Category name cannot be empty.");
      return;
    }
    setError(null);
    onSave(formData);
  };

  return (
    <div className="edit-category-overlay">
      <div className="edit-category-content">
        <div className="modal-header">
          <h2 className="edit-category-title">Edit Category</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group-category">
            <label htmlFor="name">Category Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
