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
async function createAdmin() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("MongoDB connected");
        const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const adminName = process.env.ADMIN_NAME || "Admin User";
        // Check if admin already exists
        const existingAdmin = await User_1.default.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`Admin user already exists: ${adminEmail}`);
            await mongoose_1.default.disconnect();
            return;
        }
        // Create admin user
        const admin = await User_1.default.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "admin",
        });
        console.log(`✅ Admin user created successfully!`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Password: ${adminPassword}`);
        await mongoose_1.default.disconnect();
        console.log("MongoDB disconnected");
    }
    catch (error) {
        console.error("Error creating admin:", error.message);
        process.exit(1);
    }
}
createAdmin();
