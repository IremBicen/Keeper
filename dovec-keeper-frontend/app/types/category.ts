// Category type matching backend ICategory interface
export interface Category {
  _id: string;
  name: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// For creating a new category (without _id and timestamps)
export interface CreateCategoryData {
  name: string;
  parent?: string | null;
}

