import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  type: "rating" | "text";
  minRating?: number;
  maxRating?: number;
  category: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubcategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["rating", "text"],
      default: "rating",
    },
    minRating: { type: Number, min: 0 },
    maxRating: { type: Number, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }
  },
  { timestamps: true }
);

export default mongoose.model<ISubcategory>("Subcategory", SubcategorySchema);

