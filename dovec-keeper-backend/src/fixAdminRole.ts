/**
 * Quick fix script: Update admin user role in MongoDB.
 *
 * Usage (from project root):
 *   cd dovec-keeper-backend
 *   node -r ts-node/register src/fixAdminRole.ts
 *
 * This will find the admin user by email and set their role to "admin"
 */
import mongoose from "mongoose";
import User from "./models/User";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";

async function fixAdminRole() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@dovecgroup.com";
    
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.error(`❌ Admin user with email ${adminEmail} not found.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (adminUser.role === "admin") {
      console.log(`✅ Admin user already has correct role: ${adminUser.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`🔄 Current role: ${adminUser.role}`);
    console.log(`🔄 Updating role to "admin"...`);
    
    adminUser.role = "admin";
    await adminUser.save();

    console.log(`✅ Admin role updated successfully!`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error fixing admin role:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixAdminRole();




