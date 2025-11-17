// ----------------- Types ------------------ //
export interface Evaluation {
  surveyName: string;
  employeeName: string;
  department: string;
  date: string;
  submission_status: "Submitted" | "Draft"| "Not Started";
}
  
export interface Survey {
  id: number;
  surveyName: string;
  categories: string[];
  startDate: string;
  endDate: string;
  status: "Active" | "Inactive";
  responses: number;
}
  
export interface Category {
  id: number;
  name: string;
  dateAdded: string;
}
  
export interface Subcategory {
  id: number;
  name: string;
  dateAdded: string;
  minRating: number;
  maxRating: number;
}
  
export interface CategoryWithSubcategories {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

export interface ResultData {
  id: number;
  employeeName: string;
  profilePicture: string;
  department: string;
  date: string;
  kpiScore: number;
  potential: number;
  cultureHarmony: number;
  teamEffect: number;
  executiveObservation: number;
}

export interface EmployeeResult extends ResultData {  // This is the interface for the employee result that will be used to display the employee details
  performanceScore: number;
  contributionScore: number;
  potentialScore: number;
  keeperScore: number;
}

// ----------------- Mock Data ------------------ //
//Dummy datas will be replaced with the actual data from the database
export const user = { // Represents the currently logged-in user filling out the survey.
  name: "Dila Hatay",
  department: "Technical Office",
  email: "dila.hatay@example.com",
  profilePicture: "/user-icon.png"  //Picture currently in the public folder
};
  
export const initialEvaluations: Evaluation[] = [
  {surveyName: "Employee Performance Review", employeeName: "Ayşe Demir",department: "Strategy & Operation",date: "10/29/2025",submission_status: "Not Started"},
  {surveyName: "Employee Engagement Survey", employeeName: "Mehmet Kaya",department: "Human Resources",date: "10/29/2025",submission_status: "Not Started"},
  {surveyName: "Employee Satisfaction Survey", employeeName: "Selin Arı",department: "Technical Office",date: "10/29/2025",submission_status: "Submitted"},
  {surveyName: "Employee Development Survey", employeeName: "Burak Yılmaz",department: "Sales & Marketing",date: "10/29/2025",submission_status: "Draft"},
  {surveyName: "Employee Feedback Survey", employeeName: "Ece Öz",department: "Design Office",date: "10/29/2025",submission_status: "Submitted"},
  {surveyName: "Employee Development Survey", employeeName: "Ece Öz",department: "Design Office",date: "10/31/2025",submission_status: "Submitted"},
];
  
export const mySurveysData: Survey[] = [
  {id: 1, surveyName: "Employee Performance Review",categories: ["Potential", "Team Effect"],startDate: "10/29/2025",endDate: "11/29/2025",status: "Active", responses: 120},
  {id: 2, surveyName: "Employee Engagement Survey",categories: ["Potential"],startDate: "10/29/2025",endDate: "11/29/2025",status: "Inactive", responses: 80},
  {id: 3, surveyName: "Employee Satisfaction Survey",categories: ["Potential", "Culture Harmony", "Team Effect", "Executive Observation"],startDate: "10/29/2025",endDate: "11/29/2025",status: "Inactive", responses: 200},
  {id: 4, surveyName: "Employee Development Survey",categories: ["Potential", "Culture Harmony", "Team Effect"],startDate: "10/29/2025",endDate: "11/29/2025",status: "Active", responses: 150},
  {id: 5, surveyName: "Employee Feedback Survey",categories: ["Potential", "Executive Observation"],startDate: "10/29/2025",endDate: "11/29/2025",status: "Inactive", responses: 50},
  {id: 6, surveyName: "Q4 Team Health Check", categories: ["Team Effect"], startDate: "12/01/2025", endDate: "12/15/2025", status: "Active", responses: 0},
];
  
export const initialCategories: Category[] = [
  {id: 1, name: "Potential", dateAdded: "11/05/2025"},
  {id: 2, name: "Culture Harmony", dateAdded: "11/05/2025"},
  {id: 3, name: "Team Effect", dateAdded: "11/05/2025"},
  {id: 4, name: "Executive Observation", dateAdded: "11/05/2025"},
];
  
export const initialCategoriesWithSubcategories: CategoryWithSubcategories[] = [
  {
    id: 1,
    name: "Potential",
    subcategories: [
      { id: 1, name: "Learning Speed", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 2, name: "Problem Solving", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 3, name: "Innovation", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 4, name: "Flexibility", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
    ],
  },
  {
    id: 2,
    name: "Culture Harmony",
    subcategories: [
      { id: 5, name: "Reliability", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 6, name: "Team Support", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 7, name: "Transparency", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 8, name: "Value Alignment", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
    ],
  },
  {
    id: 3,
    name: "Team Effect",
    subcategories: [
      { id: 9, name: "Collaboration", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 10, name: "Knowledge Sharing", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 11, name: "Team Morale", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 12, name: "Synergy", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
    ],
  },
  {
    id: 4,
    name: "Executive Observation",
    subcategories: [
      { id: 13, name: "Decisiveness", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 14, name: "Prioritization", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 15, name: "Accountability", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
      { id: 16, name: "Leadership", dateAdded: "24/10/2025", minRating: 1, maxRating: 5 },
    ],
  },
];

export const initialResultsData: ResultData[] = [
  {
    id: 1,
    employeeName: "Ayşe Demir",
    profilePicture: "/user-icon.png",
    department: "Strategy & Operation",
    date: "10/29/2025",
    kpiScore: 88,
    potential: 3,
    cultureHarmony: 4,
    teamEffect: 3,
    executiveObservation: 4,
  },
  {
    id: 2,
    employeeName: "Mehmet Kaya",
    profilePicture: "/user-icon.png",
    department: "Human Resources",
    date: "10/29/2025",
    kpiScore: 72,
    potential: 5,
    cultureHarmony: 4,
    teamEffect: 4,
    executiveObservation: 5,
  },
  {
    id: 3,
    employeeName: "Selin Arı",
    profilePicture: "/user-icon.png",
    department: "Technical Office",
    date: "10/29/2025",
    kpiScore: 91,
    potential: 4,
    cultureHarmony: 3,
    teamEffect: 3,
    executiveObservation: 3,
  },
  {
    id: 4,
    employeeName: "Burak Yılmaz",
    profilePicture: "/user-icon.png",
    department: "Sales & Marketing",
    date: "10/29/2025",
    kpiScore: 65,
    potential: 3,
    cultureHarmony: 4,
    teamEffect: 4,
    executiveObservation: 3,
  },
  {
    id: 5,
    employeeName: "Ece Öz",
    profilePicture: "/user-icon.png",
    department: "Design Office",
    date: "10/29/2025",
    kpiScore: 80,
    potential: 0,
    cultureHarmony: 0,
    teamEffect: 0,
    executiveObservation: 0,
  },
];
  
export const initialManagementSurveys: Survey[] = [
  {id: 1, surveyName: "Q1 Employee Satisfaction", categories: ["Culture Harmony"], startDate: "2024-01-15", endDate: "2024-02-15", status: "Active", responses: 150},
  {id: 2, surveyName: "Product Feedback", categories: ["Executive Observation"], startDate: "2024-03-01", endDate: "2024-03-31", status: "Active", responses: 250},
  {id: 3, surveyName: "New Hire Check-in", categories: ["Team Effect"], startDate: "2024-05-20", endDate: "2024-06-20", status: "Active", responses: 30},
];

export const employees = ["Ayşe Demir", "Mehmet Kaya", "Selin Arı", "Burak Yılmaz", "Ece Öz"];
export const departments = ["Strategy & Operation", "Human Resources", "Technical Office", "Sales & Marketing", "Design Office"];

export const subcategoriesData: { [key: string]: string[] } = {
    "Potential": ["Learning Speed", "Problem Solving", "Innovation", "Flexibility"],
    "Culture Harmony": ["Reliability", "Team Support", "Transparency", "Value Alignment"],
    "Team Effect": ["Collaboration", "Knowledge Sharing", "Team Morale", "Synergy"],
    "Executive Observation": ["Decisiveness", "Prioritization", "Accountability", "Leadership"],
};