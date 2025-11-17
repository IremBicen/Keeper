"use client";

import { useState, useEffect, FormEvent } from "react";
import "./subcategories.css";
import "../../components/buttons.css";
import { Subcategory } from "../../hooks/useMockData";

/* ----------------- Types ------------------ */
interface EditFormSubcategoriesProps {
  subcategory: Subcategory & { categoryName: string };
  onSave: (updatedSubcategory: Subcategory) => void;
  onClose: () => void;
}

interface FormErrors {  // Error messages for the form
  missingName?: string;
  wrongeRating?: string;
}
/*-------------------------------------------*/

export default function EditFormSubcategories({
  subcategory,
  onSave,
  onClose,
}: EditFormSubcategoriesProps) {
  const [formData, setFormData] = useState(subcategory);
  const [errors, setErrors] = useState<FormErrors>({}); // Error messages for the form  

  useEffect(() => {
    setFormData(subcategory);
  }, [subcategory]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isRating = name === "minRating" || name === "maxRating";
    const numericValue = isRating ? parseInt(value, 10) : value;

    setFormData({
      ...formData,
      [name]: isRating ? numericValue : value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) { // If the subcategory name is empty, set the error message
      newErrors.missingName = "Subcategory name cannot be empty.";
    }

    if (formData.minRating > formData.maxRating) {
      newErrors.wrongeRating = "Max rating cannot be less than min rating.";
    } else if (formData.minRating === formData.maxRating) {
      newErrors.wrongeRating = "Min and Max ratings cannot be equal.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const { categoryName, ...subData } = formData;
      onSave(subData as Subcategory);
    }
  };

  return (
    <div className="edit-subcategory-overlay">
      <div className="edit-subcategory-content">
        <div className="edit-subcategory-header">
          <h2 className="edit-subcategory-title">Edit Subcategory</h2>
          <button onClick={onClose} className="edit-subcategory-close-button">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group-subcategory">
            <label>Category Name</label>
            <input
              type="text"
              value={formData.categoryName}
              readOnly
              className="read-only-input-subcategories"
            />
          </div>
          <div className="form-group-subcategory">
            <label htmlFor="name">Subcategory Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.missingName && <p className="error-message">{errors.missingName}</p>}
          </div>
          <div className="form-group-subcategory">
            <div className="rating-group-subcategories">
              <div>
                <label htmlFor="minRating">Min Rating</label>
                <input
                  type="number"
                  id="minRating"
                  name="minRating"
                  value={formData.minRating}
                  onChange={handleChange}
                  min="0"
                  className="read-only-input-subcategories"
                />
              </div>
              <div>
                <label htmlFor="maxRating">Max Rating</label>
                <input
                  type="number"
                  id="maxRating"
                  name="maxRating"
                  value={formData.maxRating}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>
          {errors.wrongeRating && (
            <p className="error-message rating-error">{errors.wrongeRating}</p>
          )}
          <div className="edit-subcategory-footer">
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
