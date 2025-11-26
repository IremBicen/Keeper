"use client";

import { useState, FormEvent, useEffect } from "react";
import api from "../../utils/api";
import { useUser } from "../../context/UserContext";
import { CreateCategoryData } from "../../types/category";
import './categories.css';
import '../../components/buttons.css';

interface AddCategoryProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback after successful creation
}

export default function AddCategory({ onClose, onSuccess }: AddCategoryProps) {
  const { token } = useUser();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {  // Clearing the error message after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    if (!token) {
      setError("You must be logged in to add categories.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryData: CreateCategoryData = { name: name.trim() };
      await api.post("/categories", categoryData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Success - reset form and notify parent
      setName("");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create category. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
