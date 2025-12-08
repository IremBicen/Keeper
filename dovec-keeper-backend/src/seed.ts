/**
 * Local development seeding script.
 *
 * WARNING: This script deletes ALL users, categories and surveys
 * in the target database and recreates a minimal set of sample data.
 *
 * Usage (for local dev only):
 *   cd dovec-keeper-backend
 *   npx ts-node src/seed.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";
import Category from "./models/Category";
import Survey from "./models/Survey";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dovec_keeper";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Clear old data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Survey.deleteMany({});
    console.log("Old data cleared.");

    // Users
    const admin = await User.create({
      name: "Admin",
      email: "admin@dovec.com",
      password: "password",
      role: "admin",
    });

    const manager = await User.create({
      name: "Manager",
      email: "manager@dovec.com",
      password: "password",
      role: "manager",
    });

    const employee = await User.create({
      name: "Employee",
      email: "employee@dovec.com",
      password: "password",
      role: "employee",
    });

    console.log("Users created.");

    // Categories
    const cat1 = await Category.create({ name: "Performance" });
    const cat2 = await Category.create({ name: "Culture" });
    console.log("Categories created.");

    // Sample Survey
    await Survey.create({
      title: "Quarterly Evaluation",
      categories: [(cat1._id as mongoose.Types.ObjectId).toString(), (cat2._id as mongoose.Types.ObjectId).toString()],
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: "active",
      questions: [
        { id: "q1", text: "KPI Score", type: "number" },
        { id: "q2", text: "Team Effect", type: "number" },
        { id: "q3", text: "Culture Harmony", type: "number" },
        { id: "q4", text: "Executive Observation", type: "number" },
        { id: "q5", text: "Potential", type: "number" },
      ],
      createdBy: manager._id,
    });

    console.log("Sample survey created.");
    console.log("Seeding finished. Backend is ready!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();

