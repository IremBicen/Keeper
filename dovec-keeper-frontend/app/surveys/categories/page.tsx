"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import { useUser } from "../../context/UserContext";
import { Category } from "../../types/category";
import "./categories.css";
import '../../components/buttons.css';
import '../../components/table.css';
import EditFormCategories from "./EditFormCategories";
import AddCategory from "./AddCategory";
import Notification from "../../components/notification/Notification";
import DeleteConfirmation from "../../components/deleteConfirmation/DeleteConfirmation";
import { Sidebar } from "../../components/sidebar/Sidebar";

export default function CategoriesPage() {
  const { token } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch categories from backend
  const fetchCategories = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get<Category[]>("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setNotification("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (updatedCategory: Category) => {
    if (!token || !editingCategory) return;
    try {
      await api.put(`/categories/${editingCategory._id}`, { name: updatedCategory.name }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseEditModal();
      setNotification("Category successfully updated!");
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      setNotification(err.response?.data?.message || "Failed to update category.");
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSuccess = () => {
    setNotification("Category successfully added!");
    fetchCategories(); // Refresh the list
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!token || !deletingCategory) return;
    try {
      await api.delete(`/categories/${deletingCategory._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseDeleteModal();
      setNotification("Category successfully deleted!");
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      setNotification(err.response?.data?.message || "Failed to delete category.");
    }
  };

  //------------------------------------------------------------

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <div className="categories-main">
          {notification && (
            <Notification
              message={notification}
              onClose={() => setNotification(null)}
            />
          )}
          <header className="categories-header">
            <h1 className="categories-title">Categories</h1>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              + New Category
            </button>
          </header>
          <div className="box-container">
            <table className="table-container">
              <thead>
                <tr>
                  <th></th>
                  <th>Category Name</th>
                  <th>Date Added</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>No categories found</td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category._id}>
                      <td>{index + 1}</td>
                      <td>{category.name}</td>
                      <td>{category.createdAt ? new Date(category.createdAt).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEditClick(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDeleteClick(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal for editing categories */}
          {isEditModalOpen && editingCategory && (
            <EditFormCategories
              category={editingCategory}
              onSave={handleSaveCategory}
              onClose={handleCloseEditModal}
            />
          )}

           {/* Modal for adding a new category */}
           {isAddModalOpen && (
             <AddCategory onClose={handleCloseAddModal} onSuccess={handleAddSuccess} />
           )}

          {/* Modal for confirming deletion */}
          {isDeleteModalOpen && (
            <DeleteConfirmation
              onConfirm={handleConfirmDelete}
              onClose={handleCloseDeleteModal}
              message="Are you sure you want to delete this category?"
            />
          )}
        </div>
      </main>
    </div>
  );
}