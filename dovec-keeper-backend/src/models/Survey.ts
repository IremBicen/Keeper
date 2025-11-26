import mongoose, { Schema, Document } from "mongoose";

type Question = {
  id: string;
  text: string;
  type: string; // 'kpi', 'scale', etc.
  options?: string[];
};

export interface ISurvey extends Document {
  title: string;
  categories: string[]; // category ids or names
  startDate?: Date;
  endDate?: Date;
  status: "active" | "inactive" | "draft";
  questions: Question[];
  createdBy: mongoose.Types.ObjectId;
  // Assignment fields
  assignmentType?: "all" | "admins" | "managers" | "employees" | "department" | "specific";
  assignedDepartments?: string[]; // Department names
  assignedUsers?: mongoose.Types.ObjectId[]; // Specific user IDs
  assignedRoles?: string[]; // Roles that can access
}

const SurveySchema: Schema = new Schema({
  title: { type: String, required: true },
  categories: [{ type: String }],
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ["active", "inactive", "draft"], default: "draft" },
  questions: { type: Array, default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  // Assignment fields
  assignmentType: { 
    type: String, 
    enum: ["all", "admins", "managers", "employees", "department", "specific"], 
    default: "all" 
  },
  assignedDepartments: [{ type: String }], // Department names
  assignedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }], // Specific user IDs
  assignedRoles: [{ type: String }], // Roles that can access
}, { timestamps: true });

export default mongoose.model<ISurvey>("Survey", SurveySchema);
