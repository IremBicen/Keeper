"use client";

import { useState, FormEvent, useEffect } from "react";
import { Category } from "../../hooks/useMockData"; // Import the centralized Category type
import './categories.css';
import '../../components/buttons.css';

interface AddCategoryProps {
  onAdd: (newCategoryData: Omit<Category, "id" | "dateAdded">) => void;
  onClose: () => void;
}

export default function AddCategory({ onAdd, onClose }: AddCategoryProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {  // Clearing the error message after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { // If the category name is empty, set the error message
      setError("Category name cannot be empty.");
      return;
    }
    setError(null);
    onAdd({ name });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Category</h2>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
