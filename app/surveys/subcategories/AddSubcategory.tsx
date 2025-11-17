"use client";

import { useState, FormEvent, useEffect } from "react";
import "./subcategories.css";
import "../../components/buttons.css";
import { CategoryWithSubcategories, Subcategory } from "../../hooks/useMockData";
import { FaChevronDown } from "react-icons/fa";

/* ----------------- Types ------------------ */
interface AddSubcategoryProps {
  categories: CategoryWithSubcategories[];
  onAdd: (newSubcategory: Omit<Subcategory, "id" | "dateAdded">, categoryId: number) => void;
  onClose: () => void;
}

interface FormErrors {
  missingName?: string;
  wrongeRating?: string;
}
/*-------------------------------------------*/

export default function AddSubcategory({
  categories,
  onAdd,
  onClose,
}: AddSubcategoryProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>(
    categories[0]?.id || ""
  );
  const [name, setName] = useState("");
  const [minRating, setMinRating] = useState(1);
  const [maxRating, setMaxRating] = useState(5);
  const [errors, setErrors] = useState<FormErrors>({}); // Error messages for the form

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!name.trim()) { // If the subcategory name is empty, set the error message
      newErrors.missingName = "Subcategory name cannot be empty.";
    }

    if (minRating > maxRating) {
      newErrors.wrongeRating = "Max rating cannot be less than min rating.";
    } else if (minRating === maxRating) {
      newErrors.wrongeRating = "Min and Max ratings cannot be equal.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onAdd({ name, minRating, maxRating }, Number(selectedCategoryId));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Subcategory</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group-subcategory">
            <label htmlFor="category">Category</label>
            <div className="select-wrapper">
              <select
                id="category"
                name="category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="form-select"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>
          <div className="form-group-subcategory">
            <label htmlFor="name">Subcategory Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subcategory name"
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
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="maxRating">Max Rating</label>
                <input
                  type="number"
                  id="maxRating"
                  name="maxRating"
                  value={maxRating}
                  onChange={(e) => setMaxRating(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
          {errors.wrongeRating && (
            <p className="error-message rating-error">{errors.wrongeRating}</p>
          )}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Subcategory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
