"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// .env dosyasını yükle
dotenv_1.default.config();
const connectDB = async () => {
    const uri = process.env.MONGO_URI; // artık Atlas URI okunacak
    if (!uri) {
        console.error("MongoDB URI is not defined in .env");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log("MongoDB connected to Atlas");
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};
exports.default = connectDB;
