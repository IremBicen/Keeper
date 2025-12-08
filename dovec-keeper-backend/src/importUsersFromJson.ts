/**
 * Maintenance script: bulk import or update users from a JSON file.
 *
 * Usage (from project root):
 *   cd dovec-keeper-backend
 *   npx ts-node src/importUsersFromJson.ts
 *
 * By default it reads ../dovec_users.json. Override with USERS_JSON_PATH.
 * Existing users are matched by email and updated; new ones are created.
 * Passwords are hashed via the User pre-save hook.
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";

const ALLOWED_ROLES = [
  "admin",
  "director",
  "coordinator",
  "manager",
  "employee",
] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface RawUser {
  _id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  department?: string;
  departments?: string[];
  kpi?: number;
}

async function importUsersFromJson() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const defaultPath = path.join(__dirname, "../dovec_users.json");
    const filePath = process.env.USERS_JSON_PATH || defaultPath;

    console.log(`📄 Reading users from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const rawUsers: RawUser[] = JSON.parse(fileContent);

    if (!Array.isArray(rawUsers)) {
      console.error("❌ JSON file must contain an array of users");
      process.exit(1);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const raw of rawUsers) {
      const email = (raw.email || "").trim();
      const password = raw.password;
      const name = (raw.name || "").trim();

      if (!email || !password || !name) {
        console.warn(
          `⚠️ Skipping user with missing required fields (name/email/password):`,
          { name, email }
        );
        skippedCount++;
        continue;
      }

      const roleRaw = (raw.role || "employee").toString().toLowerCase();
      const role: AllowedRole = (ALLOWED_ROLES.includes(
        roleRaw as AllowedRole
      )
        ? roleRaw
        : "employee") as AllowedRole;

      const department =
        typeof raw.department === "string" ? raw.department.trim() : undefined;
      const departments = Array.isArray(raw.departments)
        ? raw.departments.map((d) => d.toString().trim()).filter(Boolean)
        : [];

      const kpi =
        typeof raw.kpi === "number" && !isNaN(raw.kpi) ? raw.kpi : 0;

      const existing = await User.findOne({ email });

      if (existing) {
        // Update existing user
        existing.name = name;
        existing.role = role;
        if (department !== undefined) {
          existing.department = department;
        }
        (existing as any).departments = departments;
        (existing as any).kpi = kpi;
        // Update password (will be re-hashed by pre-save hook)
        (existing as any).password = password;

        await existing.save();
        updatedCount++;
        console.log(`🔄 Updated user: ${email} (${role})`);
      } else {
        // Create new user
        const user = new User({
          name,
          email,
          password,
          role,
          department: department || null,
          departments,
          kpi,
        });
        await user.save();
        createdCount++;
        console.log(`✅ Created user: ${email} (${role})`);
      }
    }

    console.log("\n📊 Import finished:");
    console.log(`  Created: ${createdCount}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing users:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importUsersFromJson();


