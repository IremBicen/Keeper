"use client";

import { useState } from "react";
import "./categories.css";
import '../../components/buttons.css';
import '../../components/table.css';
import EditFormCategories from "./EditFormCategories";
import AddCategory from "./AddCategory";
import Notification from "../../components/notification/Notification";
import DeleteConfirmation from "../../components/deleteConfirmation/DeleteConfirmation";
import { useMockData, Category } from "../../hooks/useMockData";  // Importing the useMockData hook to get the mock data
import { Sidebar } from "../../components/sidebar/Sidebar";

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useMockData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<string | null>(null); // Success message for the form

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (updatedCategory: Category) => { // API will be called to update the category
    updateCategory(updatedCategory);
    handleCloseEditModal();
    setNotification("Category successfully updated!");
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddCategory = (newCategoryData: Omit<Category, "id" | "dateAdded">) => { // API will be called to add the category
    addCategory(newCategoryData);
    handleCloseAddModal();
    setNotification("Category successfully added!"); // Showing a success message for the addition
  };

  const handleDeleteClick = (category: Category) => { // API will be called to delete the category
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCategory(null);
  };

  const handleConfirmDelete = () => {   // Confirming the deletion of the category database parameters
    if (deletingCategory) {
      deleteCategory(deletingCategory.id);
      handleCloseDeleteModal();
      setNotification("Category successfully deleted!");
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
                {categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.dateAdded}</td>
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
                ))}
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
             <AddCategory onAdd={handleAddCategory} onClose={handleCloseAddModal} />
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