import mongoose, { Schema, Document } from "mongoose";

type Answer = {
  questionId: string;
  value: any;
};

export interface IResponse extends Document {
  survey: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  answers: Answer[];
  status: "draft" | "submitted";
  submittedAt?: Date;
}

const ResponseSchema: Schema = new Schema({
  survey: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Array, default: [] },
  status: { type: String, enum: ["draft", "submitted"], default: "draft" },
  submittedAt: Date
}, { timestamps: true });

export default mongoose.model<IResponse>("Response", ResponseSchema);
