import mongoose, { Schema, Document } from "mongoose";

type Answer = {
  questionId: string;
  value: any;
};

export interface IResponse extends Document {
  survey: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  evaluator?: mongoose.Types.ObjectId;
  answers: Answer[];
  status: "draft" | "submitted";
  submittedAt?: Date;
}

const ResponseSchema: Schema = new Schema(
  {
    survey: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // User who filled the evaluation (may differ from the employee being evaluated)
    evaluator: { type: Schema.Types.ObjectId, ref: "User" },
    answers: { type: Array, default: [] },
    status: { type: String, enum: ["draft", "submitted"], default: "draft" },
    submittedAt: Date,
  },
  { timestamps: true }
);

// Indexes to speed up common queries
ResponseSchema.index({ survey: 1, employee: 1 });
ResponseSchema.index({ employee: 1, status: 1 });
ResponseSchema.index({ survey: 1, status: 1 });

export default mongoose.model<IResponse>("Response", ResponseSchema);
