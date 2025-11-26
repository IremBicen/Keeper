"use client";

import { useState, useEffect } from "react";
import "./subcategories.css";
import "../../components/table.css";
import "../../components/buttons.css";
import EditFormSubcategories from "./EditFormSubcategories";
import AddSubcategory from "./AddSubcategory";
import DeleteConfirmation from "../../components/deleteConfirmation/DeleteConfirmation";
import { HiOutlineSearch } from "react-icons/hi";
import Notification from "../../components/notification/Notification";
import { Sidebar } from "../../components/sidebar/Sidebar";
import api from "../../utils/api";
import { useUser } from "../../context/UserContext";
import { Subcategory, CategoryWithSubcategories } from "../../types/subcategory";
import { Category } from "../../types/category";

export default function SubcategoriesPage() {
  const { token } = useUser();
  const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubcategory, setEditingSubcategory] = useState<(Subcategory & { categoryName: string }) | null >(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingSubcategory, setDeletingSubcategory] = useState<Subcategory | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"category" | "subcategory">("category");

  // Fetch categories and subcategories from backend
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        api.get<Category[]>("/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get<Subcategory[]>("/subcategories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Filter out any null/invalid categories and subcategories
      const categories = (categoriesRes.data || []).filter(
        (cat): cat is Category => !!cat && !!(cat as any)._id && !!cat.name
      );
      const subcategories = (subcategoriesRes.data || []).filter(
        (sub): sub is Subcategory => !!sub && !!sub._id
      );

      // Transform data to match expected structure
      const categoriesWithSubs: CategoryWithSubcategories[] = categories.map((category) => {
        const categorySubs = subcategories
          .filter((sub) => {
            // Some subcategories may have a null/undefined category – skip them safely
            const categoryField = (sub as any).category;
            if (!categoryField) return false;
            const categoryId =
              typeof categoryField === "string"
                ? categoryField
                : categoryField._id;
            return categoryId?.toString() === category._id?.toString();
          })
          .map((sub) => {
            const categoryField = (sub as any).category;
            const categoryName =
              categoryField && typeof categoryField === "object"
                ? categoryField.name
                : category.name;

            return {
            ...sub,
            id: sub._id,
              dateAdded: sub.createdAt
                ? new Date(sub.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString(),
              categoryName,
            };
          });

        return {
          _id: category._id,
          id: category._id,
          name: category.name,
          subcategories: categorySubs,
        };
      });

      setCategoriesWithSubcategories(categoriesWithSubs);
    } catch (err) {
      console.error("Error fetching data:", err);
      setNotification("Failed to load subcategories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // ------------------Editing a subcategory-----------------------
  const handleEditClick = (subcategory: Subcategory, categoryName: string) => {
    setEditingSubcategory({ ...subcategory, categoryName });
  };

  const handleCloseModal = () => {
    setEditingSubcategory(null);
  };

  const handleSaveSubcategory = async (updatedSubcategory: Subcategory) => {
    if (!token) return;
    try {
      await api.put(`/subcategories/${updatedSubcategory._id}`, {
        name: updatedSubcategory.name,
        minRating: updatedSubcategory.minRating,
        maxRating: updatedSubcategory.maxRating,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      setNotification("Subcategory successfully updated!");
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Error updating subcategory:", err);
      setNotification(err.response?.data?.message || "Failed to update subcategory.");
    }
  };

  // ------------------Adding a new subcategory-----------------------
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSubcategory = async (
    newSubcategory: Omit<Subcategory, "id" | "dateAdded" | "_id" | "category">,
    categoryId: string
  ) => {
    if (!token) return;
    try {
      await api.post("/subcategories", {
        name: newSubcategory.name,
        minRating: newSubcategory.minRating,
        maxRating: newSubcategory.maxRating,
        category: categoryId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseAddModal();
      setNotification("Subcategory successfully added!");
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Error adding subcategory:", err);
      setNotification(err.response?.data?.message || "Failed to add subcategory.");
    }
  };

  // ------------------Deleting a subcategory-----------------------
  const handleDeleteClick = (subcategory: Subcategory) => {
    setDeletingSubcategory(subcategory);
  };

  const handleCloseDeleteModal = () => {
    setDeletingSubcategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubcategory || !token) return;
    try {
      await api.delete(`/subcategories/${deletingSubcategory._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseDeleteModal();
      setNotification("Subcategory successfully deleted!");
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Error deleting subcategory:", err);
      setNotification(err.response?.data?.message || "Failed to delete subcategory.");
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
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      No subcategories found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((category) =>
                    category.subcategories.map((subcategory) => (
                      <tr key={subcategory._id || subcategory.id}>
                        <td>{category.name}</td>
                        <td>{subcategory.name}</td>
                        <td>{subcategory.dateAdded || (subcategory.createdAt ? new Date(subcategory.createdAt).toLocaleDateString() : "N/A")}</td>
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
                  )
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