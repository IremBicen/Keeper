/**
 * Maintenance script: add or fix the `department` field for existing users.
 *
 * Usage (from project root):
 *   cd dovec-keeper-backend
 *   npx ts-node src/addDepartmentToUsers.ts
 *
 * This is NOT used by the running server. Run it manually when you
 * need to backfill or correct departments after a data migration.
 */
import mongoose from "mongoose";
import User from "./models/User";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";

async function addDepartmentToUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all users without department or with null department
    const users = await User.find({
      $or: [
        { department: { $exists: false } },
        { department: null },
        { department: "" }
      ]
    });

    console.log(`\n📊 Found ${users.length} users without department field`);

    if (users.length === 0) {
      console.log("✅ All users already have department field!");
      await mongoose.disconnect();
      return;
    }

    // Show current users
    console.log("\n👥 Users to update:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // You can customize this logic to set department based on role or other criteria
    // For now, we'll set a default department or you can update manually
    
    // Option 1: Set default department for all users
    const defaultDepartment = "General"; // Change this to your default department
    
    // Option 2: Set department based on role
    const departmentByRole: { [key: string]: string } = {
      admin: "Administration",
      manager: "Management",
      employee: "Operations"
    };

    console.log(`\n🔄 Updating users...`);
    
    let updatedCount = 0;
    for (const user of users) {
      // Use role-based department or default
      const department = departmentByRole[user.role] || defaultDepartment;
      
      await User.findByIdAndUpdate(user._id, {
        $set: { department: department }
      });
      
      console.log(`✅ Updated ${user.name} → Department: ${department}`);
      updatedCount++;
    }

    console.log(`\n✨ Successfully updated ${updatedCount} users with department field!`);

    // Verify
    const allUsers = await User.find().select("name email role department");
    console.log("\n📋 All users with departments:");
    allUsers.forEach((user: any) => {
      console.log(`  - ${user.name} (${user.role}): ${user.department || "N/A"}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addDepartmentToUsers();

