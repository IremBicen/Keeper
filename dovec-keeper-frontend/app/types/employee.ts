// Employee result type for results page
export interface EmployeeResult {
  _id?: string;
  id?: string | number; // For compatibility
  employeeId?: string;
  employeeName: string;
  department: string;
  profilePicture?: string;
  surveyId?: string;
  surveyTitle?: string; // Form/Survey name
  date: string;
  kpiScore?: number;
  kpi?: number;
  potential: number;
  cultureHarmony: number;
  teamEffect: number;
  executiveObservation: number;
  performanceScore: number;
  contributionScore: number;
  potentialScore: number;
  keeperScore: number;
}

