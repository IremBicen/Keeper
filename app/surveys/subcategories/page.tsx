"use client";

import { useState } from "react";
import "./subcategories.css";
import "../../components/table.css";
import "../../components/buttons.css";
import EditFormSubcategories from "./EditFormSubcategories";
import AddSubcategory from "./AddSubcategory";
import DeleteConfirmation from "../../components/deleteConfirmation/DeleteConfirmation";
import { HiOutlineSearch } from "react-icons/hi";
import Notification from "../../components/notification/Notification";
import { useMockData, Subcategory } from "../../hooks/useMockData";
import { Sidebar } from "../../components/sidebar/Sidebar";

export default function SubcategoriesPage() {
    const { 
        categoriesWithSubcategories,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
    } = useMockData();
  const [editingSubcategory, setEditingSubcategory] = useState<(Subcategory & { categoryName: string }) | null >(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingSubcategory, setDeletingSubcategory] = useState<Subcategory | null>(null);
  const [notification, setNotification] = useState<string | null>(null); // Success message for the form
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"category" | "subcategory">("category");

  // ------------------Editing a subcategory-----------------------
  const handleEditClick = (subcategory: Subcategory, categoryName: string) => {
    setEditingSubcategory({ ...subcategory, categoryName });
  };

  const handleCloseModal = () => {
    setEditingSubcategory(null);
  };

  const handleSaveSubcategory = (updatedSubcategory: Subcategory) => { // API will be called to update the subcategory
    updateSubcategory(updatedSubcategory);
    handleCloseModal();
    setNotification("Subcategory successfully updated!"); // Showing a success message for the update
  };

  // ------------------Adding a new subcategory-----------------------
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSubcategory = (  // API will be called to add the subcategory
    newSubcategory: Omit<Subcategory, "id" | "dateAdded">,
    categoryId: number
  ) => {
    addSubcategory(newSubcategory, categoryId);
    handleCloseAddModal();
    setNotification("Subcategory successfully added!"); // Showing a success message for the addition
  };

  // ------------------Deleting a subcategory-----------------------
  const handleDeleteClick = (subcategory: Subcategory) => {
    setDeletingSubcategory(subcategory);
  };

  const handleCloseDeleteModal = () => {
    setDeletingSubcategory(null);
  };

  const handleConfirmDelete = () => {  // API will be called to delete the subcategory
    if (deletingSubcategory) {
      deleteSubcategory(deletingSubcategory.id);
      handleCloseDeleteModal();
      setNotification("Subcategory successfully deleted!"); // Showing a success message for the deletion
    }
  };

  const filteredData = categoriesWithSubcategories
    .map((category) => {
      if (searchType === "category") {  // Keep only categories whose names match the search.
        return category.name.toLowerCase().includes(searchTerm.toLowerCase())
          ? category
          : { ...category, subcategories: [] };
      }
      return {  // Every category is kept, but only matching subcategories remain inside each one.
        ...category,
        subcategories: category.subcategories.filter((subcategory) =>
          subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      };
    })
    .filter((category) => category.subcategories.length > 0);

  //-------------------------------------------------------------

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <div className="subcategories-main">
          {notification && (
            <Notification
              message={notification}
              onClose={() => setNotification(null)}
            />
          )}
          <div className="categories-header-subcategories">
            <h1>Subcategories</h1>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              + New Subcategory
            </button>
          </div>
          <div className="search-container-subcategories">
            <div className="search-box-subcategories">
              <HiOutlineSearch className="search-icon-subcategories" />
              <input
                type="text"
                placeholder={`Search by ${searchType}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-subcategories"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) =>
                setSearchType(e.target.value as "category" | "subcategory")
              }
              className="search-select-subcategories"
            >
              <option value="category">Category</option>
              <option value="subcategory">Subcategory</option>
            </select>
          </div>
          <div className="subcategories-table-container">
            <table className="subcategories-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Subcategory Name</th>
                  <th>Date Added</th>
                  <th>Rating Range</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((category) =>
                  category.subcategories.map((subcategory) => (
                    <tr key={subcategory.id}>
                      <td>{category.name}</td>
                      <td>{subcategory.name}</td>
                      <td>{subcategory.dateAdded}</td>
                      <td>{`${subcategory.minRating}-${subcategory.maxRating}`}</td>
                      <td>
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEditClick(subcategory, category.name)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDeleteClick(subcategory)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal for editing subcategories */}
          {editingSubcategory && (
            <EditFormSubcategories
              subcategory={editingSubcategory}
              onSave={handleSaveSubcategory}
              onClose={handleCloseModal}
            />
          )}

          {/* Modal for adding subcategories */}
          {isAddModalOpen && (
            <AddSubcategory
              categories={categoriesWithSubcategories}
              onAdd={handleAddSubcategory}
              onClose={handleCloseAddModal}
            />
          )}

          {/* Modal for deleting subcategories */}
          {deletingSubcategory && (
            <DeleteConfirmation
              onConfirm={handleConfirmDelete}
              onClose={handleCloseDeleteModal}
              message="Are you sure you want to delete this subcategory?"
            />
          )}
        </div>
      </main>
    </div>
  );
}