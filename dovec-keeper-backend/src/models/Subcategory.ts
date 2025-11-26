import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  minRating: number;
  maxRating: number;
  category: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubcategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    minRating: { type: Number, required: true, min: 0 },
    maxRating: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }
  },
  { timestamps: true }
);

export default mongoose.model<ISubcategory>("Subcategory", SubcategorySchema);

