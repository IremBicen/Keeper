// Response type matching backend IResponse interface
export interface Answer {
  questionId: string;
  value: any;
}

export interface Response {
  _id: string;
  survey: string | { _id: string; title: string };
  employee: string | { _id: string; name: string; email: string };
  answers: Answer[];
  status: "draft" | "submitted";
  submittedAt?: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmitResponseData {
  survey: string;
  employee: string;
  answers: Answer[];
  status: "draft" | "submitted";
}

