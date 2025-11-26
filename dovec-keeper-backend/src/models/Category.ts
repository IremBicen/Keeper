import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId | null;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: "Category", default: null }
});

export default mongoose.model<ICategory>("Category", CategorySchema);
