import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";

async function createUserFromEnv() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = process.env.NEW_USER_EMAIL;
    const password = process.env.NEW_USER_PASSWORD;
    const name = process.env.NEW_USER_NAME;
    const role = (process.env.NEW_USER_ROLE || "employee") as any;
    const kpiRaw = process.env.NEW_USER_KPI;
    const departmentSingle = process.env.NEW_USER_DEPARTMENT;

    if (!email || !password || !name) {
      console.error("❌ NEW_USER_EMAIL, NEW_USER_PASSWORD, and NEW_USER_NAME are required.");
      process.exit(1);
    }

    // Support comma-separated departments for multi-department roles
    let departments: string[] = [];
    if (departmentSingle) {
      departments = departmentSingle
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.error(`❌ User with email ${email} already exists.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const kpi =
      kpiRaw && !isNaN(Number(kpiRaw)) ? Number(kpiRaw) : undefined;

    console.log("🧾 Creating user with data:", {
      email,
      name,
      role,
      departments,
      kpi,
    });

    // Password will be hashed by UserSchema pre-save hook (bcrypt)
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: departments[0] || null,
      departments,
      ...(kpi !== undefined ? { kpi } : {}),
    });

    console.log("✅ User created:");
    const created: any = user;
    console.log({
      id: created._id?.toString(),
      name: created.name,
      email: created.email,
      role: created.role,
      department: created.department,
      departments: created.departments,
      kpi: created.kpi,
    });

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createUserFromEnv();


