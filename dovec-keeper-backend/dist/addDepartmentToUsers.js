"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";
async function addDepartmentToUsers() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose_1.default.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Get all users without department or with null department
        const users = await User_1.default.find({
            $or: [
                { department: { $exists: false } },
                { department: null },
                { department: "" }
            ]
        });
        console.log(`\n📊 Found ${users.length} users without department field`);
        if (users.length === 0) {
            console.log("✅ All users already have department field!");
            await mongoose_1.default.disconnect();
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
        const departmentByRole = {
            admin: "Administration",
            manager: "Management",
            employee: "Operations"
        };
        console.log(`\n🔄 Updating users...`);
        let updatedCount = 0;
        for (const user of users) {
            // Use role-based department or default
            const department = departmentByRole[user.role] || defaultDepartment;
            await User_1.default.findByIdAndUpdate(user._id, {
                $set: { department: department }
            });
            console.log(`✅ Updated ${user.name} → Department: ${department}`);
            updatedCount++;
        }
        console.log(`\n✨ Successfully updated ${updatedCount} users with department field!`);
        // Verify
        const allUsers = await User_1.default.find().select("name email role department");
        console.log("\n📋 All users with departments:");
        allUsers.forEach((user) => {
            console.log(`  - ${user.name} (${user.role}): ${user.department || "N/A"}`);
        });
        await mongoose_1.default.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error:", error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
addDepartmentToUsers();
