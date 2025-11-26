// Survey type matching backend ISurvey interface
export interface Question {
  id: string;
  text: string;
  type: string; // 'kpi', 'scale', etc.
  options?: string[];
}

export interface Survey {
  _id: string;
  id?: string; // For compatibility with backend responses that might use 'id'
  title: string;
  surveyName?: string; // For compatibility with existing code
  categories: string[];
  startDate?: string | Date;
  endDate?: string | Date;
  status: "active" | "inactive" | "draft";
  questions: Question[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  responses?: number; // For display purposes
  // Assignment fields
  assignmentType?: "all" | "admins" | "managers" | "employees" | "department" | "specific";
  assignedDepartments?: string[];
  assignedUsers?: string[];
  assignedRoles?: string[];
}

export interface CreateSurveyData {
  title: string;
  categories: string[];
  startDate?: string | Date;
  endDate?: string | Date;
  status?: "active" | "inactive" | "draft";
  questions: Question[];
}

