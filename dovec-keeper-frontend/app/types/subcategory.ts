export interface Subcategory {
  _id: string;
  id?: string; // For compatibility
  name: string;
  minRating: number;
  maxRating: number;
  category: string | { _id: string; name: string }; // Category ID or populated category object
  createdAt?: string;
  updatedAt?: string;
  dateAdded?: string; // For compatibility with mock data
  categoryName?: string; // For display purposes
}

export interface CreateSubcategoryData {
  name: string;
  minRating: number;
  maxRating: number;
  category: string; // Category ID
}

export interface CategoryWithSubcategories {
  _id: string;
  id?: string; // For compatibility
  name: string;
  subcategories: Subcategory[];
}

