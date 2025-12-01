"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
const Category_1 = __importDefault(require("./models/Category"));
const Survey_1 = __importDefault(require("./models/Survey"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dovec_keeper";
const seed = async () => {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("MongoDB connected for seeding...");
        // Clear old data
        await User_1.default.deleteMany({});
        await Category_1.default.deleteMany({});
        await Survey_1.default.deleteMany({});
        console.log("Old data cleared.");
        // Users
        const admin = await User_1.default.create({
            name: "Admin",
            email: "admin@dovec.com",
            password: "password",
            role: "admin",
        });
        const manager = await User_1.default.create({
            name: "Manager",
            email: "manager@dovec.com",
            password: "password",
            role: "manager",
        });
        const employee = await User_1.default.create({
            name: "Employee",
            email: "employee@dovec.com",
            password: "password",
            role: "employee",
        });
        console.log("Users created.");
        // Categories
        const cat1 = await Category_1.default.create({ name: "Performance" });
        const cat2 = await Category_1.default.create({ name: "Culture" });
        console.log("Categories created.");
        // Sample Survey
        await Survey_1.default.create({
            title: "Quarterly Evaluation",
            categories: [cat1._id.toString(), cat2._id.toString()],
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
    }
    catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};
seed();
