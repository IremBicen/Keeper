import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "director" | "coordinator" | "manager" | "employee";
  department?: string;
  kpi?: number; // KPI score for each user (admin can set this)
  comparePassword: (candidate: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "director", "coordinator", "manager", "employee"],
    default: "manager",
  },
  department: { type: String, default: null },
  kpi: { type: Number, default: 0, min: 0 } // KPI score for each user (admin can set this)
}, { timestamps: true });

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
